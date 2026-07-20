import { StoreReadyRepository } from './storeReady.repository';

export class StoreReadyService {
  private repo = new StoreReadyRepository();
  markReady(input: { orderId: string; storeId: string; requestId: string; actorId: string }) {
    return this.repo.markReady({ ...input, actorType: 'admin' });
  }
  markReadyAsPartner(input: { orderId: string; storeId: string; requestId: string; actorId: string }) {
    return this.repo.markReady({ ...input, actorType: 'store' });
  }
}
