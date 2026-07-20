import { supabase } from '../../db/supabase';
import { AdminOrderRepository } from './adminOrder.repository';
import { OrderLifecycleService } from './orderLifecycle.service';
import { NotFoundError, BadRequestError, ForbiddenError, ConflictError } from '../../middleware/error.middleware';
import { ErrandService } from '../errand/errand.service';

export class AdminOrderService {
  private repo = new AdminOrderRepository();
  private lifecycleService = new OrderLifecycleService();
  private errandService = new ErrandService();

  async listOrders(status?: string) {
    return this.repo.listOrders(status);
  }

  async getOrderItems(orderId: string) {
    const data = await this.repo.getOrderItems(orderId);
    return (data || []).map((r: any) => ({
      ...r,
      name: r.menu_items?.name || '',
      name_ar: r.menu_items?.name_ar || '',
      menu_items: r.menu_items,
    }));
  }

  async cleanupDevelopmentDispatch(
    payload: any,
    actor: { id: string | null; email: string | null; role: string },
    ip: string | null
  ) {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenError('Nettoyage destructif interdit en production');
    }

    if (payload?.confirm !== 'DELETE_TEST_ORDERS') {
      throw new BadRequestError('Confirmation requise: DELETE_TEST_ORDERS');
    }

    const result = await this.repo.cleanupDevelopmentDispatch();

    await this.repo.writeAuditLog({
      admin_id: actor.id,
      admin_email: actor.email,
      action: 'development_dispatch_cleanup',
      entity_type: 'orders',
      entity_id: null,
      summary: `Admin cleaned development dispatch board (${result.orders_deleted} orders deleted)`,
      new_value: result,
      ip,
    });

    return { ok: true, ...result };
  }

  async patchOrder(
    orderId: string,
    updates: any,
    actor: { id: string | null; email: string | null; role: string },
    ip: string | null
  ) {
    const order = await this.repo.getOrderById(orderId);
    if (!order) {
      throw new NotFoundError('Commande introuvable');
    }

    const { status, driver_id, notes, admin_note, payment_status, reason } = updates;

    // 1. Payment status update
    if (payment_status !== undefined) {
      if (!['super_admin', 'finance'].includes(actor.role)) {
        throw new ForbiddenError('Modification du statut de paiement non autorisée');
      }

      await this.repo.updateOrderDirect(orderId, { payment_status });
      if (order.user_id) {
        await supabase.from('notifications_log').insert({
          title: 'Mise à jour de paiement 💳',
          body: 'Le statut de votre paiement pour la commande #' + orderId.slice(0, 8) + ' a été mis à jour à : ' + (payment_status === 'paid' ? 'Payé' : payment_status) + '. [order_id: ' + orderId + ']',
          target: order.user_id,
          sent_by: 'admin_edit',
        });
      }

      // Log to local audit_log
      await this.repo.writeAuditLog({
        admin_id: actor.id,
        admin_email: actor.email,
        action: 'update_payment_status',
        entity_type: 'orders',
        entity_id: orderId,
        summary: `Admin updated payment status of order ${orderId} to ${payment_status}`,
        new_value: { payment_status },
        ip,
      });

      // Record in history log
      await this.repo.insertOrderStatusHistory({
        order_id: orderId,
        event_type: 'admin_override',
        from_status: null,
        to_status: null,
        actor_type: 'admin',
        actor_id: actor.email || actor.id || 'admin',
        reason: `Payment status updated to ${payment_status}`,
        metadata: { payment_status }
      });

      // If nothing else is changing, return early
      if (status === undefined && driver_id === undefined && notes === undefined && admin_note === undefined) {
        return { ok: true };
      }
    }

    // 2. Notes update only
    if ((notes !== undefined || admin_note !== undefined) && !status && driver_id === undefined) {
      const notesValue = notes !== undefined ? notes : admin_note;
      await this.repo.updateOrderDirect(orderId, { notes: notesValue });
      if (order.user_id) {
        await supabase.from('notifications_log').insert({
          title: 'Instructions modifiées 📝',
          body: 'L\'administrateur a mis à jour les détails de votre commande #' + orderId.slice(0, 8) + ' : "' + notesValue + '". [order_id: ' + orderId + ']',
          target: order.user_id,
          sent_by: 'admin_edit',
        });
      }
      return { ok: true };
    }

    // 3. Driver assignment only
    if (driver_id !== undefined && !status) {
      if(!['super_admin','operations'].includes(actor.role)) throw new ForbiddenError('Assignation livreur non autorisee.','driver_assignment_forbidden');
      if (order.order_type === 'errand') {
        if (order.dispatch_mode !== 'MANUAL_DISPATCH' || order.moderation_status !== 'approved' || order.status !== 'confirmed') {
          throw new ConflictError('Cette course doit etre approuvee avant assignation.', 'errand_not_assignable');
        }
        if (driver_id) {
          const { data: driver, error: driverError } = await supabase.from('drivers').select('id,is_active,is_verified').eq('id',driver_id).maybeSingle();
          if (driverError) throw new Error(driverError.message);
          if (!driver || driver.is_active !== true || driver.is_verified !== true) {
            throw new ConflictError('Le livreur doit etre actif et verifie.', 'errand_driver_not_verified');
          }
        }
      }
      const oldDriverId = order.driver_id;
      await this.repo.updateOrderDirect(orderId, { driver_id: driver_id || null });
      if (order.order_type === 'errand') {
        if (driver_id) await this.lifecycleService.prepareConfirmationCodes(orderId);
        await this.errandService.syncAdminAssignment(orderId,driver_id || null,actor.id || actor.email || 'admin');
      }
      if (order.user_id) {
        await supabase.from('notifications_log').insert({
          title: 'Livreur assigné 🛵',
          body: driver_id 
            ? 'Un livreur a été assigné et va récupérer votre commande #' + orderId.slice(0, 8) + '. [order_id: ' + orderId + ']'
            : 'Le livreur pour votre commande #' + orderId.slice(0, 8) + ' a été modifié. [order_id: ' + orderId + ']',
          target: order.user_id,
          sent_by: 'admin_edit',
        });
      }

      // Record in history log
      await this.repo.insertOrderStatusHistory({
        order_id: orderId,
        event_type: 'driver_assignment',
        from_status: null,
        to_status: null,
        actor_type: 'admin',
        actor_id: actor.email || actor.id || 'admin',
        reason: driver_id ? `Admin assigned driver ${driver_id}` : 'Admin unassigned driver',
        metadata: { driver_id: driver_id || null, old_driver_id: oldDriverId }
      });

      return { ok: true };
    }

    // 4. Status update (routes through unified OrderLifecycleService)
    if (status !== undefined) {
      const allowed = ['pending', 'confirmed', 'preparing', 'picked_up', 'delivered', 'completed', 'cancelled'];
      if (!allowed.includes(status)) {
        throw new BadRequestError('حالة غير صالحة');
      }

      if (order.order_type === 'errand' && status !== 'cancelled') {
        throw new ForbiddenError('Utilisez la revue dediee; les etapes sont reservees au livreur.', 'errand_stage_admin_forbidden');
      }
      if(order.order_type==='errand'&&(!reason||String(reason).trim().length<3)) throw new BadRequestError('Motif obligatoire pour annuler une course.','errand_cancellation_reason_required');

      await this.lifecycleService.transitionOrder(
        orderId,
        { type: 'admin', id: actor.id, email: actor.email || undefined },
        status,
        order.order_type==='errand'?String(reason):`Admin override: ${actor.email || 'admin'}`,
        { old_status: order.status }
      );

      if (order.order_type === 'errand' && status === 'cancelled') {
        await this.errandService.syncAdminCancellation(orderId, actor.id || actor.email || 'admin', String(reason));
      }

      // Log to local audit_log
      await this.repo.writeAuditLog({
        admin_id: actor.id,
        admin_email: actor.email,
        action: 'update_order_status',
        entity_type: 'orders',
        entity_id: orderId,
        summary: `Admin updated order status of ${orderId} to ${status}`,
        old_value: { status: order.status },
        new_value: { status },
        ip,
      });

      return { ok: true };
    }

    return { ok: true };
  }
}
