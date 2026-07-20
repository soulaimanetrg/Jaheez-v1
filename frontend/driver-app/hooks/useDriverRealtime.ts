import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { apiBase, tokenStore, type Driver } from '@/lib/api';
import { REALTIME_EVENTS } from '@/lib/realtimeEvents';

type DriverRealtimeHandlers = {
  onOffer?: (payload: { order_id: string; expires_at?: string }) => void;
  onOfferExpired?: (payload: { order_id: string }) => void;
  onReassigned?: (payload: { order_id: string; reason?: string }) => void;
};

export function useDriverRealtime(driver: Driver | null, handlers: DriverRealtimeHandlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!driver?.id) return;
    const driverId = driver.id;

    let cancelled = false;
    let socket: Socket | null = null;

    async function connect() {
      const token = await tokenStore.get();
      if (!token || cancelled) return;

      socket = io(apiBase, {
        path: '/socket.io',
        auth: { token, actor: 'driver' },
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
      });

      socket.on('connect', () => {
        socket?.emit('join_room', `driver:${driverId}`, (result?: { ok: boolean; error?: string }) => {
          if (!result?.ok) {
            if (__DEV__) console.warn('[socket] Failed to join driver room:', result?.error || 'unknown_error');
          }
        });
      });

      socket.on('connect_error', (error) => {
        if (__DEV__) console.warn('[socket] Driver realtime connection failed:', error.message);
      });

      socket.on(REALTIME_EVENTS.ORDER_OFFERED, (payload) => {
        handlersRef.current.onOffer?.(payload);
      });

      socket.on(REALTIME_EVENTS.ORDER_OFFER_EXPIRED, (payload) => {
        handlersRef.current.onOfferExpired?.(payload);
      });

      socket.on(REALTIME_EVENTS.ORDER_REASSIGNED, (payload) => {
        handlersRef.current.onReassigned?.(payload);
      });
    }

    void connect();

    return () => {
      cancelled = true;
      socket?.disconnect();
    };
  }, [driver?.id]);
}
