import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';
import { REALTIME_EVENTS } from '../features/realtime/realtime.events';

const root = resolve(__dirname, '../../..');

describe('cross-app realtime event contract', () => {
  it('uses one driver offer event name across backend and driver app', () => {
    expect(REALTIME_EVENTS.ORDER_OFFERED).toBe('order:offered');

    const backendAdminService = readFileSync(resolve(root, 'backend/src/features/admin/admin.service.ts'), 'utf8');
    const backendDispatchService = readFileSync(resolve(root, 'backend/src/features/dispatch/dispatch.service.ts'), 'utf8');
    const driverRealtimeHook = readFileSync(resolve(root, 'frontend/driver-app/hooks/useDriverRealtime.ts'), 'utf8');

    expect(backendAdminService).not.toContain('order:new_offer');
    expect(backendDispatchService).toContain('REALTIME_EVENTS.ORDER_OFFERED');
    expect(driverRealtimeHook).toContain('REALTIME_EVENTS.ORDER_OFFERED');
  });
});

