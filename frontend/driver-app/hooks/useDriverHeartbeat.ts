import { useCallback, useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import * as Location from 'expo-location';
import { driverApi, type Driver } from '@/lib/api';
import { useDriverStore } from '@/store/driverStore';

const HEARTBEAT_MS = 20_000;
const MAX_REASONABLE_SPEED_MPS = 45; // ~162 km/h. Anything above is not trusted for fault attribution.

type LastPoint = {
  latitude: number;
  longitude: number;
  recordedAtMs: number;
};

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function distanceMeters(a: LastPoint, b: LastPoint) {
  const earthRadiusMeters = 6_371_000;
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusMeters * Math.asin(Math.sqrt(h));
}

export function useDriverHeartbeat(driver: Driver | null) {
  const setDriver = useDriverStore(s => s.setDriver);
  const inFlightRef = useRef(false);
  const permissionRef = useRef<Location.PermissionStatus | null>(null);
  const lastPointRef = useRef<LastPoint | null>(null);

  const getPermission = useCallback(async () => {
    if (permissionRef.current === Location.PermissionStatus.GRANTED) return true;

    const existing = await Location.getForegroundPermissionsAsync();
    if (existing.status === Location.PermissionStatus.GRANTED) {
      permissionRef.current = existing.status;
      return true;
    }

    const requested = await Location.requestForegroundPermissionsAsync();
    permissionRef.current = requested.status;
    return requested.status === Location.PermissionStatus.GRANTED;
  }, []);

  const getGpsTelemetry = useCallback(async () => {
    if (!driver?.shift_active && !driver?.is_online) return {};

    const hasPermission = await getPermission();
    if (!hasPermission) {
      return { continuity_valid: false };
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      mayShowUserSettingsDialog: true,
    });

    const latitude = location.coords.latitude;
    const longitude = location.coords.longitude;
    const recordedAtMs = location.timestamp || Date.now();
    let continuityValid = true;

    const previous = lastPointRef.current;
    const current: LastPoint = { latitude, longitude, recordedAtMs };
    if (previous && recordedAtMs > previous.recordedAtMs) {
      const seconds = Math.max(1, (recordedAtMs - previous.recordedAtMs) / 1000);
      const inferredSpeed = distanceMeters(previous, current) / seconds;
      if (inferredSpeed > MAX_REASONABLE_SPEED_MPS) {
        continuityValid = false;
      }
    }
    lastPointRef.current = current;

    const rawLocation = location as any;

    return {
      latitude,
      longitude,
      accuracy: typeof location.coords.accuracy === 'number' ? location.coords.accuracy : null,
      heading: typeof location.coords.heading === 'number' && location.coords.heading >= 0 ? location.coords.heading : null,
      speed: typeof location.coords.speed === 'number' && location.coords.speed >= 0 ? location.coords.speed : null,
      client_recorded_at: new Date(recordedAtMs).toISOString(),
      is_mocked: rawLocation.mocked === true || rawLocation.coords?.mocked === true,
      continuity_valid: continuityValid,
    };
  }, [driver?.is_online, driver?.shift_active, getPermission]);

  const sendHeartbeat = useCallback(async () => {
    if (!driver || inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const gpsTelemetry = await getGpsTelemetry();
      const result = await driverApi.updateLocation({
        app_active: true,
        is_background: false,
        ...gpsTelemetry,
      });
      if (result.driver) setDriver(result.driver);
    } catch (error: any) {
      if (__DEV__) console.warn('[heartbeat] Failed to send driver heartbeat:', error?.message || error);
    } finally {
      inFlightRef.current = false;
    }
  }, [driver?.id, getGpsTelemetry, setDriver]);

  useEffect(() => {
    if (!driver) return;

    sendHeartbeat();
    const intervalId = setInterval(sendHeartbeat, HEARTBEAT_MS);

    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        sendHeartbeat();
      }
    });

    return () => {
      clearInterval(intervalId);
      subscription.remove();
    };
  }, [driver?.id, sendHeartbeat]);
}
