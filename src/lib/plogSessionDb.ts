import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Local persistence for the in-progress Plog session (C1 state machine).
 * Written here — not just kept in React state — so the session survives the
 * app being killed mid-recording (C3.1 recovery). GPS points themselves are
 * a separate table, added alongside the actual background-location wiring.
 *
 * At most one row ever exists (a single in-progress session); `status`
 * never stores 'idle' — no row means idle.
 */
export const PLOG_SESSION_SCHEMA = `
create table if not exists plog_sessions (
  id text primary key,
  status text not null check (status in ('recording', 'paused')),
  started_at text not null,
  paused_at text,
  paused_duration_sec integer not null default 0
);
`;

export type PlogSessionRow = {
  id: string;
  status: 'recording' | 'paused';
  started_at: string;
  paused_at: string | null;
  paused_duration_sec: number;
};

export function getActivePlogSession(db: SQLiteDatabase): Promise<PlogSessionRow | null> {
  return db.getFirstAsync<PlogSessionRow>('select * from plog_sessions limit 1');
}

export async function insertPlogSession(db: SQLiteDatabase, id: string, startedAt: string): Promise<void> {
  await db.runAsync(
    'insert into plog_sessions (id, status, started_at, paused_duration_sec) values (?, ?, ?, 0)',
    id,
    'recording',
    startedAt
  );
}

export async function setPlogSessionPaused(db: SQLiteDatabase, id: string, pausedAt: string): Promise<void> {
  await db.runAsync('update plog_sessions set status = ?, paused_at = ? where id = ?', 'paused', pausedAt, id);
}

export async function resumePlogSession(db: SQLiteDatabase, id: string, pausedDurationSec: number): Promise<void> {
  await db.runAsync(
    'update plog_sessions set status = ?, paused_at = null, paused_duration_sec = ? where id = ?',
    'recording',
    pausedDurationSec,
    id
  );
}

export async function deletePlogSession(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('delete from plog_sessions where id = ?', id);
}
