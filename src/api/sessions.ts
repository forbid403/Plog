import { supabase } from './supabase';
import { prepareUploadJpeg } from '../lib/photo-upload';

export type RoutePoint = {
  lat: number;
  lng: number;
  alt: number | null;
  t: string;
};

export type CreateSessionPayload = {
  startedAt: string;
  endedAt: string;
  timezone: string;
  durationSec: number;
  distanceKm: number;
  elevationGainM: number | null;
  avgPaceSecPerKm: number | null;
  /** Full recorded route, unfiltered (distance/elevation already excluded low-accuracy/paused points for their own numbers — the stored route is for display, G7.3/G4.5). */
  route: RoutePoint[];
};

export type SessionRow = {
  id: string;
  title: string;
};

export type SessionDetail = {
  id: string;
  startedAt: string;
  timezone: string;
  durationSec: number;
  distanceKm: number;
  elevationGainM: number | null;
  liters: number | null;
  photoUrl: string | null;
  /** Reverse-geocoded (B5.1/G7.2) — [Proposed], not computed server-side yet, always null for now. */
  placeName: string | null;
  route: RoutePoint[];
};

function toSessionDetail(row: {
  id: string;
  started_at: string;
  timezone: string;
  duration_sec: number;
  distance_km: number;
  elevation_gain_m: number | null;
  liters: number | null;
  photo_url: string | null;
  place_name: string | null;
  route: RoutePoint[];
}): SessionDetail {
  return {
    id: row.id,
    startedAt: row.started_at,
    timezone: row.timezone,
    durationSec: row.duration_sec,
    distanceKm: row.distance_km,
    elevationGainM: row.elevation_gain_m,
    liters: row.liters,
    photoUrl: row.photo_url,
    placeName: row.place_name,
    route: row.route,
  };
}

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const userId = data.session?.user.id;
  if (!userId) throw new Error('No signed-in user (see src/api/auth.ts signUp).');
  return userId;
}

/**
 * C6: creates the session row at "Finish & Log litter" time (C4's guard
 * sheet). Litter fields (D2-D5) are left null here — updateLitter fills
 * them in once the Litter log screen submits. `title` isn't sent: the
 * sessions_set_title trigger (G4.4) generates it server-side from
 * started_at/timezone.
 */
export async function createSession(payload: CreateSessionPayload): Promise<SessionRow> {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: userId,
      started_at: payload.startedAt,
      ended_at: payload.endedAt,
      timezone: payload.timezone,
      duration_sec: payload.durationSec,
      distance_km: payload.distanceKm,
      elevation_gain_m: payload.elevationGainM,
      // avg_pace_sec_per_km is `integer` in the schema — computeAvgPaceSecPerKm
      // (src/lib/plogSessionTime.ts) returns a plain division result, fractional.
      avg_pace_sec_per_km: payload.avgPaceSecPerKm !== null ? Math.round(payload.avgPaceSecPerKm) : null,
      route: payload.route,
    })
    .select('id, title')
    .single();
  if (error) throw error;
  return data;
}

/** E (Impact card) / F (session detail): fetches one session, owner-only (RLS). */
export async function getSessionDetail(id: string): Promise<SessionDetail> {
  const { data, error } = await supabase
    .from('sessions')
    .select('id, started_at, timezone, duration_sec, distance_km, elevation_gain_m, liters, photo_url, place_name, route')
    .eq('id', id)
    .single();
  if (error) throw error;
  return toSessionDetail(data);
}

export type UpdateLitterPayload = {
  fillRatio: number;
  bagSizeLiters: number | null;
  liters: number;
  /** Local file URI (e.g. from expo-image-picker) — uploaded to the session-photos bucket here. Omit/null for no photo. */
  photoUri?: string | null;
};

/** D7: fills in the litter fields createSession left null, uploading the photo (if any) first. */
export async function updateLitter(sessionId: string, payload: UpdateLitterPayload): Promise<void> {
  const photoUrl = payload.photoUri ? await uploadSessionPhoto(sessionId, payload.photoUri) : null;

  const { error } = await supabase
    .from('sessions')
    .update({
      fill_ratio: payload.fillRatio,
      bag_size_liters: payload.bagSizeLiters,
      liters: payload.liters,
      ...(photoUrl ? { photo_url: photoUrl } : {}),
    })
    .eq('id', sessionId);
  if (error) throw error;
}

async function uploadSessionPhoto(sessionId: string, uri: string, fileName: string = sessionId): Promise<string> {
  const userId = await currentUserId();
  const response = await fetch(await prepareUploadJpeg(uri));
  const blob = await response.blob();
  const path = `${userId}/${fileName}.jpg`;

  const { error } = await supabase.storage.from('session-photos').upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: true,
  });
  if (error) throw error;

  return supabase.storage.from('session-photos').getPublicUrl(path).data.publicUrl;
}

export type SessionStart = {
  startedAt: string;
  timezone: string;
};

/**
 * B3/B4 (Home streak + This Week): start time and stored time zone of every
 * session the signed-in user has (RLS limits rows to them). Only these two
 * columns, so it stays light even with a long history.
 */
export async function listSessionStarts(): Promise<SessionStart[]> {
  const { data, error } = await supabase.from('sessions').select('started_at, timezone').order('started_at', { ascending: false });
  if (error) throw error;
  return data.map((row: { started_at: string; timezone: string }) => ({ startedAt: row.started_at, timezone: row.timezone }));
}

/** G4.2 feed card + session detail (Figma 681:2562). One shape for both. */
export type MySession = {
  id: string;
  title: string;
  placeName: string | null;
  startedAt: string;
  timezone: string;
  distanceKm: number;
  durationSec: number;
  avgPaceSecPerKm: number | null;
  elevationGainM: number | null;
  liters: number | null;
  /** How full the bag was (D2), 0–1; null until litter is logged. */
  fillRatio: number | null;
  /** Every photo, main photo first. */
  photoUrls: string[];
  route: RoutePoint[];
};

const MY_SESSION_COLUMNS =
  'id, title, place_name, started_at, timezone, distance_km, duration_sec, avg_pace_sec_per_km, elevation_gain_m, liters, fill_ratio, photo_url, photo_urls, route';

type MySessionRow = {
  id: string;
  title: string;
  place_name: string | null;
  started_at: string;
  timezone: string;
  distance_km: number | string;
  duration_sec: number;
  avg_pace_sec_per_km: number | null;
  elevation_gain_m: number | string | null;
  liters: number | string | null;
  fill_ratio: number | string | null;
  photo_url: string | null;
  photo_urls: string[] | null;
  route: RoutePoint[];
};

const numOrNull = (v: number | string | null) => (v === null ? null : Number(v));

function toMySession(row: MySessionRow): MySession {
  // The litter log (updateLitter) only writes photo_url; photo_urls is
  // filled once a photo is added/removed on the detail screen.
  const photoUrls = row.photo_urls?.length ? row.photo_urls : row.photo_url ? [row.photo_url] : [];
  return {
    id: row.id,
    title: row.title,
    placeName: row.place_name,
    startedAt: row.started_at,
    timezone: row.timezone,
    distanceKm: Number(row.distance_km),
    durationSec: row.duration_sec,
    avgPaceSecPerKm: row.avg_pace_sec_per_km,
    elevationGainM: numOrNull(row.elevation_gain_m),
    liters: numOrNull(row.liters),
    fillRatio: numOrNull(row.fill_ratio),
    photoUrls,
    route: row.route ?? [],
  };
}

/**
 * G4: every session of the signed-in user, newest first. Search, sort and
 * the impact totals are done on the device from this list. [Proposed]
 * infinite scroll (G4.6) isn't built — fine at MVP volumes.
 */
export async function listMySessions(): Promise<MySession[]> {
  const { data, error } = await supabase.from('sessions').select(MY_SESSION_COLUMNS).order('started_at', { ascending: false });
  if (error) throw error;
  return (data as MySessionRow[]).map(toMySession);
}

export async function getMySession(id: string): Promise<MySession> {
  const { data, error } = await supabase.from('sessions').select(MY_SESSION_COLUMNS).eq('id', id).single();
  if (error) throw error;
  return toMySession(data as MySessionRow);
}

export type SessionEdits = {
  title: string;
  /** Photos to keep, in order (already-uploaded public URLs). */
  keptPhotoUrls: string[];
  /** Local file URIs picked on the device, uploaded and appended after the kept ones. */
  newPhotoUris: string[];
  /** Previously saved photos the user removed — deleted from storage after the row is updated. */
  removedPhotoUrls: string[];
};

/** Session detail "Save" (Figma 681:2616): rename + photo changes. */
export async function saveSessionEdits(sessionId: string, edits: SessionEdits): Promise<void> {
  const uploaded: string[] = [];
  for (const uri of edits.newPhotoUris) {
    uploaded.push(await uploadSessionPhoto(sessionId, uri, `${sessionId}-${Date.now()}-${uploaded.length}`));
  }
  const photoUrls = [...edits.keptPhotoUrls, ...uploaded];

  const { error } = await supabase
    .from('sessions')
    .update({ title: edits.title, photo_urls: photoUrls, photo_url: photoUrls[0] ?? null })
    .eq('id', sessionId);
  if (error) throw error;

  await removeSessionPhotos(edits.removedPhotoUrls);
}

/** Session detail "Delete this session": photos first (storage rows are only metadata), then the row. */
export async function deleteSession(sessionId: string, photoUrls: string[]): Promise<void> {
  await removeSessionPhotos(photoUrls);
  const { error } = await supabase.from('sessions').delete().eq('id', sessionId);
  if (error) throw error;
}

const PHOTO_BUCKET_MARKER = '/session-photos/';

async function removeSessionPhotos(publicUrls: string[]): Promise<void> {
  const paths = publicUrls
    .map((url) => url.split(PHOTO_BUCKET_MARKER)[1]?.split('?')[0])
    .filter((p): p is string => Boolean(p));
  if (!paths.length) return;
  // A leftover file is harmless; don't fail the user's save/delete over it.
  const { error } = await supabase.storage.from('session-photos').remove(paths);
  if (error) console.error('[sessions] photo cleanup failed:', error);
}
