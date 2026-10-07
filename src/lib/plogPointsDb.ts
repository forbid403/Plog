import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * GPS points recorded during a Plog session (C3.1). Written by the
 * background location task (src/lib/backgroundLocationTask.ts) — this
 * module is just the schema + CRUD, used both from there and from the
 * recording screen (which only reads, per spec: "the screen only reads
 * from the database").
 */
export const PLOG_POINTS_SCHEMA = `
create table if not exists plog_points (
  id integer primary key autoincrement,
  session_id text not null,
  lat real not null,
  lng real not null,
  alt real,
  accuracy real,
  t text not null,
  is_paused integer not null default 0
);
create index if not exists plog_points_session_idx on plog_points (session_id);
`;

export type PlogPointRow = {
  id: number;
  session_id: string;
  lat: number;
  lng: number;
  alt: number | null;
  accuracy: number | null;
  t: string;
  is_paused: number; // SQLite has no boolean column type — 0/1
};

export type NewPlogPoint = {
  sessionId: string;
  lat: number;
  lng: number;
  alt: number | null;
  accuracy: number | null;
  t: string;
  isPaused: boolean;
};

export async function insertPoint(db: SQLiteDatabase, point: NewPlogPoint): Promise<void> {
  await db.runAsync(
    'insert into plog_points (session_id, lat, lng, alt, accuracy, t, is_paused) values (?, ?, ?, ?, ?, ?, ?)',
    point.sessionId,
    point.lat,
    point.lng,
    point.alt,
    point.accuracy,
    point.t,
    point.isPaused ? 1 : 0
  );
}

export function getPointsForSession(db: SQLiteDatabase, sessionId: string): Promise<PlogPointRow[]> {
  return db.getAllAsync<PlogPointRow>('select * from plog_points where session_id = ? order by id asc', sessionId);
}

export async function deletePointsForSession(db: SQLiteDatabase, sessionId: string): Promise<void> {
  await db.runAsync('delete from plog_points where session_id = ?', sessionId);
}
