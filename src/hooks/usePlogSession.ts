import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { startBackgroundLocationTracking, stopBackgroundLocationTracking } from '../lib/backgroundLocationTask';
import { deletePointsForSession } from '../lib/plogPointsDb';
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
  /**
   * False until the initial expo-sqlite read completes. `status` reads as
   * 'idle' during that window regardless of the real persisted state — any
   * effect that redirects/acts on `status === 'idle'` must also check this,
   * or it'll fire on the false "idle" default before hydration finishes.
   */
  hydrated: boolean;
  /** Null when idle. Read GPS points for this session from plog_points (plogPointsDb.ts). */
  sessionId: string | null;
  /** Active recording time in seconds — excludes paused periods (C3), live-updates once a second while recording. */
  elapsedSec: number;
  start: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  /**
   * Ends the session (finish sheet's "Finish & Log litter", C4), stops
   * background tracking, and returns its summary for C6's save. Points
   * stay in `plog_points` (keyed by the returned id) — C6 reads and then
   * cleans them up after a successful upload, not this.
   */
  finish: () => Promise<PlogSessionSummary>;
  /** Deletes the in-progress session and its points, stops background tracking (finish sheet's "Discard", C4). */
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
 * Also owns the background location task's lifecycle (C3.1): start() turns
 * it on, finish()/discard() turn it off — pause()/resume() deliberately
 * don't touch it, the task keeps running and just marks points `is_paused`
 * based on this hook's own status (see backgroundLocationTask.ts).
 *
 * GPS points themselves live in plog_points (plogPointsDb.ts), read via
 * `sessionId` — not returned from this hook directly. The server save (C6)
 * is still separate, not built yet.
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
    if (row) return; // already recording/paused — insertPlogSession also guards this, but avoid the redundant work/calls
    const startedAt = new Date().toISOString();
    const id = localId();
    await insertPlogSession(db, id, startedAt);
    setRow({ id, status: 'recording', started_at: startedAt, paused_at: null, paused_duration_sec: 0 });
    setNow(new Date());
    try {
      await startBackgroundLocationTracking();
    } catch (e) {
      // Don't let a tracking failure block the state transition/navigation
      // — recording should still proceed (foreground-only, same fallback
      // as a denied background permission) rather than silently stranding
      // the caller on the idle screen.
      console.error('[plog] failed to start background location tracking:', e);
    }
  }, [db, row]);

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
    await stopBackgroundLocationTracking();
    await deletePlogSession(db, row.id);
    setRow(null);
    return { id: row.id, startedAt: row.started_at, endedAt, durationSec };
  }, [db, row]);

  const discard = useCallback(async () => {
    if (!row) return;
    await stopBackgroundLocationTracking();
    await deletePointsForSession(db, row.id);
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
    hydrated,
    sessionId: row?.id ?? null,
    elapsedSec,
    start,
    pause,
    resume,
    finish,
    discard,
  };
}
