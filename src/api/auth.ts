import { supabase } from './supabase';
import { prepareUploadJpeg } from '../lib/photo-upload';

export type Profile = {
  userId: string;
  nickname: string;
  avatarUrl: string | null;
};

function toProfile(row: { id: string; nickname: string; avatar_url: string | null }): Profile {
  return { userId: row.id, nickname: row.nickname, avatarUrl: row.avatar_url };
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

/**
 * Profile setup (spec A4). Signs in anonymously if there's no session yet,
 * uploads the avatar (if given), then creates the profile row. Mirrors the
 * spec's `POST /users` — the "token" part of that response is handled
 * internally by supabase-js (see supabase.ts's SecureStore adapter) rather
 * than returned here.
 */
export async function signUp(nickname: string, avatarUri?: string): Promise<Profile> {
  let session = await getSession();
  if (!session) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    session = data.session;
  }
  if (!session) {
    throw new Error('Anonymous sign-in did not return a session.');
  }

  const userId = session.user.id;
  const avatarUrl = avatarUri ? await uploadAvatar(userId, avatarUri) : null;

  const { data: row, error } = await supabase
    .from('profiles')
    .insert({ id: userId, nickname, avatar_url: avatarUrl })
    .select()
    .single();
  if (error) throw error;

  return toProfile(row);
}

async function uploadAvatar(userId: string, uri: string): Promise<string> {
  const response = await fetch(await prepareUploadJpeg(uri));
  const blob = await response.blob();
  const path = `${userId}/avatar.jpg`;

  const { error } = await supabase.storage.from('avatars').upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: true,
  });
  if (error) throw error;

  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
}

/** Returns null if there's no session, or no profile row yet (sign-in happened but A4's "Continue" step hasn't). */
export async function getMyProfile(): Promise<Profile | null> {
  const session = await getSession();
  if (!session) return null;

  const { data, error } = await supabase.from('profiles').select().eq('id', session.user.id).maybeSingle();
  if (error) throw error;

  return data ? toProfile(data) : null;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

const STORAGE_BUCKETS = ['avatars', 'session-photos', 'impact-cards'] as const;

/**
 * Account deletion — required by Apple (5.1.1(v)) and Google Play for any
 * app that creates accounts; not in the spec, built from scratch.
 *
 * Storage files are removed first, via the Storage API (not SQL — rows in
 * storage.objects are just metadata, deleting them directly wouldn't
 * remove the underlying file). Each bucket's upload convention is
 * `{userId}/...` (see the storage_buckets migration), so listing that
 * prefix finds everything this user ever uploaded.
 *
 * DB rows (profiles, sessions, user_badges) and the auth user itself are
 * then deleted server-side by the delete_my_account() Postgres function
 * (security definer — a plain client can't delete from auth.users
 * directly), which also enforces that the caller can only ever delete
 * their own row (reads auth.uid() itself, doesn't take an id argument).
 *
 * Signs out with `scope: 'local'` afterward — the server-side session is
 * already gone along with the user, so there's nothing for a normal
 * (server-round-trip) signOut() to invalidate; this just clears the
 * locally cached token.
 */
export async function deleteAccount(): Promise<void> {
  const session = await getSession();
  if (!session) return;
  const userId = session.user.id;

  for (const bucket of STORAGE_BUCKETS) {
    const { data: files } = await supabase.storage.from(bucket).list(userId);
    if (files?.length) {
      await supabase.storage.from(bucket).remove(files.map((f) => `${userId}/${f.name}`));
    }
  }

  const { error } = await supabase.rpc('delete_my_account');
  if (error) throw error;

  await supabase.auth.signOut({ scope: 'local' });
}
