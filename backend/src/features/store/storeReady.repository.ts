import { supabase } from '../../db/supabase';
import { ConflictError, NotFoundError } from '../../utils/errors';

export class StoreReadyRepository {
  async markReady(params: { orderId: string; storeId: string; actorType: 'admin' | 'store'; actorId: string; requestId: string }) {
    const { data, error } = await supabase.rpc('mark_order_store_ready', {
      p_order_id: params.orderId, p_store_id: params.storeId, p_actor_type: params.actorType,
      p_actor_id: params.actorId, p_request_id: params.requestId,
    });
    if (error) {
      if (error.message.startsWith('not_found:')) throw new NotFoundError('Commande introuvable', 'order_not_found');
      if (error.message.startsWith('conflict:')) throw new ConflictError('Transition de commande invalide', 'order_transition_conflict');
      throw new Error(error.message);
    }
    return data;
  }
}
