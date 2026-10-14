#!/usr/bin/env node
/**
 * Builds supabase/seed_routes.sql — the Recommended Routes catalog (B5,
 * B5.1 [Recommended]: pre-built from OpenStreetMap, stored in our own DB).
 *
 * Run from the project root, on a normal internet connection:
 *
 *   node scripts/build-route-seed.mjs --list   # show candidate routes around Sydney
 *   node scripts/build-route-seed.mjs          # write supabase/seed_routes.sql
 *
 * Then `supabase db reset` loads them, and commit the generated SQL so the
 * rest of the team (and the hosted DB) get the same routes.
 *
 * Which routes: put OSM relation ids in PICKED_RELATION_IDS (from --list).
 * Left empty, it picks automatically: named walking routes in the box below,
 * 2–15 km long, up to MAX_AUTO_PICKS.
 *
 * Data: route geometry from the Overpass API (© OpenStreetMap contributors,
 * ODbL). Elevation gain from the Open-Meteo elevation API (90 m terrain
 * model, so it's approximate). Dev-time tool only — the app never calls these.
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const PICKED_RELATION_IDS = [];

// south, west, north, east — Sydney CBD, eastern suburbs, inner west, lower north shore
const BBOX = [-34.0, 151.05, -33.75, 151.32];
const MIN_KM = 2;
const MAX_KM = 15;
const MAX_AUTO_PICKS = 10;
const OUTPUT = 'supabase/seed_routes.sql';
const USER_AGENT = 'plog-route-seed/1.0 (dev script)';

const EARTH_RADIUS_M = 6371000;
const toRad = (deg) => (deg * Math.PI) / 180;

export function haversineM(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

const key = (p) => `${p.lat.toFixed(7)},${p.lng.toFixed(7)}`;

/** Joins ways that share endpoints into as few continuous lines as possible. */
export function chainWays(ways) {
  const remaining = ways.filter((w) => w.length > 1).map((w) => [...w]);
  const segments = [];
  while (remaining.length) {
    let line = remaining.shift();
    let extended = true;
    while (extended) {
      extended = false;
      for (let i = 0; i < remaining.length; i++) {
        const w = remaining[i];
        const head = key(line[0]);
        const tail = key(line[line.length - 1]);
        if (key(w[0]) === tail) line = line.concat(w.slice(1));
        else if (key(w[w.length - 1]) === tail) line = line.concat([...w].reverse().slice(1));
        else if (key(w[w.length - 1]) === head) line = w.slice(0, -1).concat(line);
        else if (key(w[0]) === head) line = [...w].reverse().slice(0, -1).concat(line);
        else continue;
        remaining.splice(i, 1);
        extended = true;
        break;
      }
    }
    segments.push(line);
  }
  return segments;
}

export function lengthKm(segments) {
  let m = 0;
  for (const seg of segments) for (let i = 1; i < seg.length; i++) m += haversineM(seg[i - 1], seg[i]);
  return m / 1000;
}

/** A route is a loop when it has no dead ends: every way endpoint is shared an even number of times. */
export function isLoop(ways, tags) {
  if (tags?.roundtrip === 'yes') return true;
  if (tags?.roundtrip === 'no') return false;
  const degree = new Map();
  for (const w of ways) {
    if (w.length < 2) continue;
    for (const p of [w[0], w[w.length - 1]]) degree.set(key(p), (degree.get(key(p)) ?? 0) + 1);
  }
  return [...degree.values()].every((d) => d % 2 === 0);
}

/** Drops points closer than minM to the last kept one (keeps each line's last point). */
export function thin(segments, minM = 15) {
  return segments.map((seg) => {
    const out = [seg[0]];
    for (let i = 1; i < seg.length - 1; i++) if (haversineM(out[out.length - 1], seg[i]) >= minM) out.push(seg[i]);
    out.push(seg[seg.length - 1]);
    return out;
  });
}

export function samplePoints(segments, max = 100) {
  const all = segments.flat();
  if (all.length <= max) return all;
  return Array.from({ length: max }, (_, i) => all[Math.round((i * (all.length - 1)) / (max - 1))]);
}

export function elevationGainM(elevations) {
  let gain = 0;
  for (let i = 1; i < elevations.length; i++) gain += Math.max(0, elevations[i] - elevations[i - 1]);
  return Math.round(gain);
}

const sqlText = (s) => `'${String(s).replace(/'/g, "''")}'`;
const round5 = (n) => Math.round(n * 1e5) / 1e5;

export function toRow(rel) {
  const ways = rel.members
    .filter((m) => m.type === 'way' && Array.isArray(m.geometry))
    .map((m) => m.geometry.map((g) => ({ lat: g.lat, lng: g.lon })));
  const segments = chainWays(ways);
  const loop = isLoop(ways, rel.tags);
  const longest = segments.reduce((a, b) => (b.length > a.length ? b : a), segments[0] ?? []);
  return {
    osmId: rel.id,
    name: rel.tags.name,
    type: loop ? 'loop' : 'one_way',
    distanceKm: Math.round(lengthKm(segments) * 10) / 10,
    start: longest[0],
    segments: thin(segments).map((seg) => seg.map((p) => ({ lat: round5(p.lat), lng: round5(p.lng) }))),
  };
}

async function fetchCandidates() {
  const [s, w, n, e] = BBOX;
  const query = `[out:json][timeout:120];
rel["type"="route"]["route"~"^(foot|hiking|walking|running)$"]["name"](${s},${w},${n},${e});
out body geom;`;
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': USER_AGENT },
    body: new URLSearchParams({ data: query }),
  });
  if (!res.ok) throw new Error(`Overpass request failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  const relations = json.elements.filter((el) => el.type === 'relation');
  const rows = relations.filter((el) => el.members?.length).map(toRow).filter((r) => r.start);
  console.log(`Overpass returned ${relations.length} route relations; ${rows.length} have usable geometry.`);
  return rows;
}

async function fetchElevationGain(segments) {
  const pts = samplePoints(segments);
  const url =
    'https://api.open-meteo.com/v1/elevation' +
    `?latitude=${pts.map((p) => p.lat).join(',')}&longitude=${pts.map((p) => p.lng).join(',')}`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`Open-Meteo elevation failed: ${res.status}`);
  const { elevation } = await res.json();
  return elevationGainM(elevation);
}

export function toSql(rows) {
  const values = rows.map(
    (r) =>
      `  (${sqlText(r.name)}, ${sqlText(r.type)}, ${r.distanceKm}, ${r.elevationGainM ?? 'null'}, ` +
      `${r.start.lat}, ${r.start.lng}, ${sqlText(JSON.stringify(r.segments))}::jsonb, 'osm', ${sqlText(r.osmId)})`
  );
  return `-- GENERATED FILE — do not edit by hand.
-- Regenerate: node scripts/build-route-seed.mjs
-- Route data © OpenStreetMap contributors (ODbL). Elevation: Open-Meteo.
insert into public.routes (name, type, distance_km, elevation_gain_m, start_lat, start_lng, path, source, source_id) values
${values.join(',\n')};
`;
}

async function main() {
  const listOnly = process.argv.includes('--list');
  const candidates = (await fetchCandidates()).sort((a, b) => a.name.localeCompare(b.name));

  if (listOnly) {
    for (const r of candidates) {
      const fits = r.distanceKm >= MIN_KM && r.distanceKm <= MAX_KM ? ' ' : '*';
      console.log(`${fits} ${String(r.osmId).padEnd(10)} ${r.type.padEnd(8)} ${String(r.distanceKm).padStart(6)} km  ${r.name}`);
    }
    console.log(`\n${candidates.length} routes. * = outside ${MIN_KM}–${MAX_KM} km. Put the ids you want in PICKED_RELATION_IDS.`);
    return;
  }

  let picks;
  if (PICKED_RELATION_IDS.length) {
    picks = PICKED_RELATION_IDS.map((id) => candidates.find((r) => r.osmId === id) ?? id);
    const missing = picks.filter((p) => typeof p === 'number');
    if (missing.length) throw new Error(`Not found in the search box: ${missing.join(', ')}`);
  } else {
    picks = candidates.filter((r) => r.distanceKm >= MIN_KM && r.distanceKm <= MAX_KM).slice(0, MAX_AUTO_PICKS);
  }
  if (!picks.length) throw new Error('No routes picked — run with --list to see what was found.');

  for (const r of picks) {
    try {
      r.elevationGainM = await fetchElevationGain(r.segments);
    } catch (e) {
      console.warn(`  elevation unavailable for ${r.name}: ${e.message}`);
      r.elevationGainM = null;
    }
    console.log(`  ${r.type.padEnd(8)} ${String(r.distanceKm).padStart(5)} km  ${String(r.elevationGainM ?? '–').padStart(4)} m  ${r.name}`);
  }

  writeFileSync(OUTPUT, toSql(picks));
  console.log(`\nWrote ${picks.length} routes to ${OUTPUT}. Next: supabase db reset`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
