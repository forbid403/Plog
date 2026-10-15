import type { SQLiteDatabase } from 'expo-sqlite';
import type { CreateSessionPayload } from '../api/sessions';

/**
 * C6 "On network failure, keep locally and retry": a finished session's
 * createSession payload, kept here until the server save succeeds. Retried
 * from the Plog screen's failure alert and on every Home visit
 * (retryPendingSessionSaves in src/api/sessions.ts).
 */
export const PENDING_SESSION_SAVES_SCHEMA = `
create table if not exists pending_session_saves (
  id text primary key,
  payload text not null
);
`;

/**
 * Stores the payload and drops the session's plog_points in one
 * transaction — the payload already carries the full route, so the points
 * are no longer needed and nothing is lost if the save never succeeds.
 */
export async function queuePendingSessionSave(db: SQLiteDatabase, payload: CreateSessionPayload): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('insert or replace into pending_session_saves (id, payload) values (?, ?)', payload.id, JSON.stringify(payload));
    await db.runAsync('delete from plog_points where session_id = ?', payload.id);
  });
}

export async function getPendingSessionSaves(db: SQLiteDatabase): Promise<CreateSessionPayload[]> {
  const rows = await db.getAllAsync<{ payload: string }>('select payload from pending_session_saves order by rowid asc');
  return rows.map((r) => JSON.parse(r.payload) as CreateSessionPayload);
}

export async function deletePendingSessionSave(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('delete from pending_session_saves where id = ?', id);
}

/** Account deletion: an unsaved session must not resurface under the next account. */
export async function clearPendingSessionSaves(db: SQLiteDatabase): Promise<void> {
  await db.runAsync('delete from pending_session_saves');
}
