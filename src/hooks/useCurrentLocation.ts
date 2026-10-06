import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

export type LocationPermissionState = 'checking' | 'granted' | 'denied';

export type UseCurrentLocationResult = {
  permission: LocationPermissionState;
  location: Location.LocationObject | null;
};

/**
 * Foreground location only (C2 idle screen — blue dot + follow camera).
 * Background recording (C3.1) is a separate, not-yet-built piece that uses
 * expo-task-manager instead of this hook.
 */
export function useCurrentLocation(): UseCurrentLocationResult {
  const [permission, setPermission] = useState<LocationPermissionState>('checking');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription | undefined;
    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;

      if (status !== 'granted') {
        setPermission('denied');
        return;
      }
      setPermission('granted');

      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 5 },
        (next) => {
          if (!cancelled) setLocation(next);
        }
      );
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);

  return { permission, location };
}
