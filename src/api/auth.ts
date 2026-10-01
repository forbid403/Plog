import { supabase } from './supabase';

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
  const response = await fetch(uri);
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
