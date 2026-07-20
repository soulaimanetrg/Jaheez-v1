import { useEffect, useState } from 'react';
import { getBackendAccessToken } from '../lib/backendApi';
import { connectOrderSocket } from '../lib/orderApi';
import type { DriverLocation, OrderStatus } from '@shared/types';

export function useTracking(
  orderId: string | undefined,
  driverId: string | undefined,
  targetLat?: number,
  targetLng?: number,
) {
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    let socket: ReturnType<typeof connectOrderSocket> | null = null;
    let cancelled = false;

    getBackendAccessToken().then((token) => {
      if (!token || cancelled) return;
      socket = connectOrderSocket(orderId, token, {
        onStatusUpdate: (status) => setOrderStatus(status as OrderStatus),
        onLocationUpdate: (location) => {
          const nextLocation: DriverLocation = {
            id: `${orderId}:${Date.now()}`,
            driver_id: driverId || '',
            lat: location.latitude,
            lng: location.longitude,
            speed: location.speed ?? undefined,
            heading: location.heading ?? undefined,
            created_at: new Date().toISOString(),
          };
          setDriverLocation(nextLocation);

          if (targetLat !== undefined && targetLng !== undefined) {
            const km = distanceKm(location.latitude, location.longitude, targetLat, targetLng);
            setEtaMinutes(Math.max(1, Math.round((km / 25) * 60)));
          }
        },
        onSocketError: () => setIsConnected(false),
      });
      socket.on('connect', () => setIsConnected(true));
      socket.on('disconnect', () => setIsConnected(false));
    });

    return () => {
      cancelled = true;
      setIsConnected(false);
      socket?.disconnect();
    };
  }, [driverId, orderId, targetLat, targetLng]);

  return { driverLocation, orderStatus, etaMinutes, isConnected };
}

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return earthRadiusKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function toRadians(value: number) {
  return value * (Math.PI / 180);
}
