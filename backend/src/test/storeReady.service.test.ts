import { beforeEach, describe, expect, it, vi } from 'vitest';

const repoMock = {
  markReady: vi.fn(),
};

vi.mock('../features/store/storeReady.repository', () => ({
  StoreReadyRepository: vi.fn(function StoreReadyRepositoryMock() {
    return repoMock;
  }),
}));

import { StoreReadyService } from '../features/store/storeReady.service';

describe('StoreReadyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repoMock.markReady.mockResolvedValue({
      id: 'order-1',
      store_id: 'store-1',
      store_ready_at: '2026-06-24T10:00:00.000Z',
    });
  });

  it('marks admin ready events with admin actor type and supplied store scope', async () => {
    await new StoreReadyService().markReady({
      orderId: 'order-1',
      storeId: 'store-1',
      requestId: 'ready-admin-1',
      actorId: 'admin-1',
    });

    expect(repoMock.markReady).toHaveBeenCalledWith({
      orderId: 'order-1',
      storeId: 'store-1',
      requestId: 'ready-admin-1',
      actorId: 'admin-1',
      actorType: 'admin',
    });
  });

  it('marks partner ready events with store actor type and credential-derived store scope', async () => {
    await new StoreReadyService().markReadyAsPartner({
      orderId: 'order-1',
      storeId: 'credential-store-1',
      requestId: 'ready-store-1',
      actorId: 'credential-1',
    });

    expect(repoMock.markReady).toHaveBeenCalledWith({
      orderId: 'order-1',
      storeId: 'credential-store-1',
      requestId: 'ready-store-1',
      actorId: 'credential-1',
      actorType: 'store',
    });
  });
});
