import { supabase } from './supabase';

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
      avg_pace_sec_per_km: payload.avgPaceSecPerKm,
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

async function uploadSessionPhoto(sessionId: string, uri: string): Promise<string> {
  const userId = await currentUserId();
  const response = await fetch(uri);
  const blob = await response.blob();
  const path = `${userId}/${sessionId}.jpg`;

  const { error } = await supabase.storage.from('session-photos').upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: true,
  });
  if (error) throw error;

  return supabase.storage.from('session-photos').getPublicUrl(path).data.publicUrl;
}
