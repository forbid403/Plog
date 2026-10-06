import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import {
  deletePlogSession,
  getActivePlogSession,
  insertPlogSession,
  resumePlogSession,
  setPlogSessionPaused,
  type PlogSessionRow,
} from '../lib/plogSessionDb';
import { computeActiveElapsedSec, computePauseDurationSec } from '../lib/plogSessionTime';

export type PlogSessionStatus = 'idle' | 'recording' | 'paused';

export type PlogSessionSummary = {
  id: string;
  startedAt: string;
  endedAt: string;
  durationSec: number;
};

export type UsePlogSessionResult = {
  status: PlogSessionStatus;
  /** Active recording time in seconds — excludes paused periods (C3), live-updates once a second while recording. */
  elapsedSec: number;
  start: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  /** Ends the session (called from the finish sheet's "Finish & Log litter", C4) and returns its summary for C6's save. */
  finish: () => Promise<PlogSessionSummary>;
  /** Deletes the in-progress session (finish sheet's "Discard", C4). */
  discard: () => Promise<void>;
};

function localId(): string {
  // Ephemeral local-only id (never sent to the server — C6 assigns the real
  // session id), so a real UUID library isn't needed for this.
  let id = '';
  for (let i = 0; i < 32; i++) id += Math.floor(Math.random() * 16).toString(16);
  return id;
}

/**
 * Drives the C1 state flow (idle → recording ⇄ paused) and persists it to
 * expo-sqlite so an in-progress session survives the app being killed
 * (C3.1 recovery — on mount, this hook hydrates from whatever's in the DB).
 *
 * Scope: status + timing only. GPS point recording (C3.1) and the server
 * save (C6) are separate, built alongside this.
 */
export function usePlogSession(): UsePlogSessionResult {
  const db = useSQLiteContext();
  const [row, setRow] = useState<PlogSessionRow | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    getActivePlogSession(db).then((activeRow) => {
      setRow(activeRow);
      setHydrated(true);
    });
  }, [db]);

  useEffect(() => {
    if (row?.status !== 'recording') return;
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [row?.status]);

  const start = useCallback(async () => {
    const startedAt = new Date().toISOString();
    const id = localId();
    await insertPlogSession(db, id, startedAt);
    setRow({ id, status: 'recording', started_at: startedAt, paused_at: null, paused_duration_sec: 0 });
    setNow(new Date());
  }, [db]);

  const pause = useCallback(async () => {
    if (!row) return;
    const pausedAt = new Date().toISOString();
    await setPlogSessionPaused(db, row.id, pausedAt);
    setRow((current) => (current ? { ...current, status: 'paused', paused_at: pausedAt } : current));
  }, [db, row]);

  const resume = useCallback(async () => {
    if (!row?.paused_at) return;
    const resumedAt = new Date();
    const pausedDurationSec = row.paused_duration_sec + computePauseDurationSec(row.paused_at, resumedAt);
    await resumePlogSession(db, row.id, pausedDurationSec);
    setRow((current) => (current ? { ...current, status: 'recording', paused_at: null, paused_duration_sec: pausedDurationSec } : current));
    setNow(resumedAt);
  }, [db, row]);

  const finish = useCallback(async (): Promise<PlogSessionSummary> => {
    if (!row) throw new Error('usePlogSession.finish() called with no active session');
    const endedAt = row.paused_at ?? new Date().toISOString();
    const durationSec = computeActiveElapsedSec({
      startedAt: row.started_at,
      pausedDurationSec: row.paused_duration_sec,
      pausedAt: row.paused_at,
      now: new Date(),
    });
    await deletePlogSession(db, row.id);
    setRow(null);
    return { id: row.id, startedAt: row.started_at, endedAt, durationSec };
  }, [db, row]);

  const discard = useCallback(async () => {
    if (!row) return;
    await deletePlogSession(db, row.id);
    setRow(null);
  }, [db, row]);

  const elapsedSec =
    hydrated && row
      ? computeActiveElapsedSec({
          startedAt: row.started_at,
          pausedDurationSec: row.paused_duration_sec,
          pausedAt: row.paused_at,
          now,
        })
      : 0;

  return {
    status: row?.status ?? 'idle',
    elapsedSec,
    start,
    pause,
    resume,
    finish,
    discard,
  };
}
