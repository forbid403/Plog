#!/usr/bin/env node
/**
 * Fills your LOCAL Supabase with demo plogging sessions, so My, Your Impact
 * and Home have something to show without walking around.
 *
 *   node scripts/seed-demo-sessions.mjs            # add demo sessions
 *   node scripts/seed-demo-sessions.mjs --dry-run  # just print what it would add
 *
 * - Goes to the most recently created profile = the account your simulator
 *   signed up as. Sign up in the app first.
 * - Re-running replaces the previous demo sessions only. They're marked with
 *   route_thumbnail_url = 'demo-seed' (a column the app doesn't use yet).
 * - Local only: reads the URL and service key from `supabase status`, and
 *   refuses to run against anything that isn't 127.0.0.1 / localhost.
 *
 * What you get: 6 consecutive days ending yesterday (an active streak and the
 * 5-day badge), sessions spread across 2026 for the Your Impact chart, two in
 * 2025 for the year picker, one 0 L session, one with litter not logged yet,
 * and photos on most (the onboarding photos in assets/onboarding/).
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const TZ = 'Australia/Sydney';
const DEMO_MARKER = 'demo-seed';
const PHOTOS = ['assets/onboarding/slide1.jpg', 'assets/onboarding/slide2.jpg'];

const PLACES = [
  { name: 'Surry Hills', lat: -33.8886, lng: 151.2094 },
  { name: 'Bondi', lat: -33.8915, lng: 151.2767 },
  { name: 'Centennial Park', lat: -33.8986, lng: 151.2327 },
  { name: 'Glebe', lat: -33.8797, lng: 151.1857 },
  { name: 'Around UTS', lat: -33.8832, lng: 151.2005 },
  { name: 'Pyrmont', lat: -33.8696, lng: 151.1942 },
  { name: 'Coogee', lat: -33.9205, lng: 151.2577 },
  { name: 'Newtown', lat: -33.8981, lng: 151.1745 },
];

// Fixed older dates (local Sydney); anything after today is skipped.
const OLDER_DATES = ['2025-11-08', '2025-12-20', '2026-01-24', '2026-03-10', '2026-04-05', '2026-05-18', '2026-07-02', '2026-08-24', '2026-09-12'];
const STREAK_DAYS = 6; // consecutive days ending yesterday

const FILLS = [0.5, 1, 0.25, 0.75, 0.1, 1, 0.5, 0, 0.75, 0.25, 1, 0.5, 0.75, 0.25, 1];
const BAGS = [15, 10, 20, 5, 15, 25, 10, 15, 20, 10, 15, 5, 10, 20, 15];
const HOURS = [7, 17, 12, 8, 18, 6, 13, 19, 9, 16, 7, 18, 10, 17, 8];
const NOT_LOGGED_INDEX = 4; // one session with litter not logged yet (D8)

function zonedParts(ms, tz) {
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(ms));
  const get = (t) => Number(parts.find((p) => p.type === t).value);
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute') };
}

export function todayKey(now = Date.now()) {
  const p = zonedParts(now, TZ);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

export function addDays(key, days) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** A local wall-clock time in `tz` → the real instant (handles DST). */
export function zonedToUtc(key, hour, minute, tz = TZ) {
  const [y, m, d] = key.split('-').map(Number);
  const wanted = Date.UTC(y, m - 1, d, hour, minute);
  let t = wanted;
  for (let i = 0; i < 3; i++) {
    const p = zonedParts(t, tz);
    t += wanted - Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  }
  return new Date(t);
}

/** A rough loop around `place` whose length ≈ distanceKm, one point every ~30 s. */
function loopRoute(place, distanceKm, startedAt, durationSec, seed) {
  const n = 40;
  const r = distanceKm / (2 * Math.PI); // km
  const dLat = r / 111;
  const dLng = r / (111 * Math.cos((place.lat * Math.PI) / 180));
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = (i / n) * 2 * Math.PI;
    const wobble = 1 + 0.15 * Math.sin(a * 3 + seed);
    return {
      lat: Number((place.lat + dLat * wobble * Math.sin(a) - dLat).toFixed(6)),
      lng: Number((place.lng + dLng * wobble * (1 - Math.cos(a))).toFixed(6)),
      alt: null,
      t: new Date(startedAt.getTime() + (i / n) * durationSec * 1000).toISOString(),
    };
  });
}

/** Pure: the demo rows (minus user id / photo URLs) for a given "today". */
export function buildDemoSessions(today) {
  const streak = Array.from({ length: STREAK_DAYS }, (_, i) => addDays(today, -(STREAK_DAYS - i)));
  const dates = [...OLDER_DATES.filter((d) => d < streak[0]), ...streak];

  return dates.map((date, i) => {
    const place = PLACES[i % PLACES.length];
    const distanceKm = Math.round((2.4 + ((i * 1.37) % 6)) * 100) / 100;
    const paceSecPerKm = 330 + ((i * 17) % 90);
    const durationSec = Math.round(distanceKm * paceSecPerKm);
    const startedAt = zonedToUtc(date, HOURS[i % HOURS.length], (i * 7) % 60);
    const endedAt = new Date(startedAt.getTime() + durationSec * 1000);
    const notLogged = i === NOT_LOGGED_INDEX;
    const fill = FILLS[i % FILLS.length];
    const bag = BAGS[i % BAGS.length];
    return {
      date,
      place_name: place.name,
      started_at: startedAt.toISOString(),
      ended_at: endedAt.toISOString(),
      timezone: TZ,
      duration_sec: durationSec,
      distance_km: distanceKm,
      elevation_gain_m: 8 + ((i * 13) % 70),
      avg_pace_sec_per_km: paceSecPerKm,
      route: loopRoute(place, distanceKm, startedAt, durationSec, i),
      fill_ratio: notLogged ? null : fill,
      bag_size_liters: notLogged ? null : bag,
      liters: notLogged ? null : Math.round(fill * bag * 10) / 10,
      photoIndex: notLogged || i % 3 === 2 ? null : i % PHOTOS.length,
    };
  });
}

function localClient(createClient) {
  let out;
  try {
    out = execSync('supabase status -o env', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    throw new Error('`supabase status` failed. Run this from the Plog folder with `supabase start` running.');
  }
  const env = Object.fromEntries(
    out
      .split('\n')
      .map((line) => line.trim().match(/^([A-Z_]+)="?([^"]*)"?$/))
      .filter(Boolean)
      .map((m) => [m[1], m[2]])
  );
  const url = env.API_URL;
  const key = env.SERVICE_ROLE_KEY || env.SECRET_KEY;
  if (!url || !key) throw new Error('Could not find API_URL and SERVICE_ROLE_KEY in `supabase status -o env`.');
  if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/.test(url)) throw new Error(`Refusing to seed a non-local database: ${url}`);
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function main() {
  const rows = buildDemoSessions(todayKey());

  if (process.argv.includes('--dry-run')) {
    for (const r of rows) {
      console.log(`${r.date}  ${r.place_name.padEnd(16)} ${String(r.distance_km).padStart(5)} km  ${r.liters ?? '–'} L  photo:${r.photoIndex ?? '-'}`);
    }
    console.log(`\n${rows.length} sessions (dry run, nothing written).`);
    return;
  }

  const { createClient } = await import('@supabase/supabase-js');
  const db = localClient(createClient);

  const { data: profile, error: profileError } = await db
    .from('profiles')
    .select('id, nickname')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile) throw new Error('No profile yet — open the app and finish onboarding first.');

  const photoUrls = [];
  for (const [i, path] of PHOTOS.entries()) {
    const objectPath = `${profile.id}/demo-${i + 1}.jpg`;
    const { error } = await db.storage.from('session-photos').upload(objectPath, readFileSync(path), { contentType: 'image/jpeg', upsert: true });
    if (error) throw error;
    photoUrls.push(db.storage.from('session-photos').getPublicUrl(objectPath).data.publicUrl);
  }

  const { error: clearError } = await db.from('sessions').delete().eq('user_id', profile.id).eq('route_thumbnail_url', DEMO_MARKER);
  if (clearError) throw clearError;

  const inserts = rows.map(({ date, photoIndex, ...row }) => {
    const photo = photoIndex === null ? null : photoUrls[photoIndex];
    return { ...row, user_id: profile.id, route_thumbnail_url: DEMO_MARKER, photo_url: photo, photo_urls: photo ? [photo] : [] };
  });
  const { error: insertError } = await db.from('sessions').insert(inserts);
  if (insertError) throw insertError;

  console.log(`Added ${inserts.length} demo sessions for "${profile.nickname}". Pull down to refresh the My tab.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e.message ?? e);
    process.exit(1);
  });
}
