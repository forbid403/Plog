import * as Location from 'expo-location';
import { openDatabaseAsync } from 'expo-sqlite';
import * as TaskManager from 'expo-task-manager';
import { getActivePlogSession } from './plogSessionDb';
import { insertPoint } from './plogPointsDb';

export const BACKGROUND_LOCATION_TASK = 'plog-background-location';

type BackgroundLocationTaskData = { locations: Location.LocationObject[] };

/**
 * Background GPS recording (C3.1). `defineTask` must run at module/global
 * scope — not inside a component — so this file needs a side-effect import
 * somewhere that always loads at launch (app/_layout.tsx) even if the app
 * was relaunched in the background by the OS to deliver a location update.
 *
 * Writes straight to SQLite via a fresh connection (not useSQLiteContext —
 * this runs outside the React tree). Points are marked `is_paused` based on
 * the *live* `plog_sessions.status` row, which is the single source of
 * truth both this task and the UI read/write — this task never holds its
 * own copy of "are we paused" in memory.
 */
TaskManager.defineTask<BackgroundLocationTaskData>(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    // kCLErrorDomain Code=0 is kCLErrorLocationUnknown — Apple's own docs
    // say this is often transient (location manager just doesn't have a
    // fix yet, e.g. no simulated location set) and shouldn't be treated as
    // fatal. Only genuinely unexpected errors get logged as errors.
    const isLocationUnknown = typeof error.message === 'string' && error.message.includes('kCLErrorDomain Code=0');
    if (isLocationUnknown) {
      console.warn('[plog] background location: no fix yet (kCLErrorLocationUnknown) — will retry on the next update');
    } else {
      console.error('[plog] background location task error:', error);
    }
    return;
  }
  if (!data?.locations?.length) return;

  const db = await openDatabaseAsync('plog.db');
  const session = await getActivePlogSession(db);
  if (!session) return; // no in-progress session (task should've been stopped on finish/discard)

  for (const location of data.locations) {
    await insertPoint(db, {
      sessionId: session.id,
      lat: location.coords.latitude,
      lng: location.coords.longitude,
      alt: location.coords.altitude,
      accuracy: location.coords.accuracy,
      t: new Date(location.timestamp).toISOString(),
      isPaused: session.status === 'paused',
    });
  }
});

/** Requests background permission (spec 0.4: "on first session Start") and starts the task. */
export async function startBackgroundLocationTracking(): Promise<void> {
  const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  if (alreadyStarted) return;

  const { status } = await Location.requestBackgroundPermissionsAsync();
  if (status !== 'granted') {
    // Foreground-only fallback: the OS just won't keep delivering updates
    // once backgrounded. Not throwing — recording can still proceed in
    // the foreground, which is better than blocking Start entirely.
    console.warn('[plog] background location permission not granted — recording will pause when backgrounded');
  }

  await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
    accuracy: Location.Accuracy.BestForNavigation,
    distanceInterval: 5,
    activityType: Location.ActivityType.Fitness,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'Plog',
      notificationBody: 'Plog is recording your session',
    },
  });
}

export async function stopBackgroundLocationTracking(): Promise<void> {
  const started = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  if (started) await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
}
