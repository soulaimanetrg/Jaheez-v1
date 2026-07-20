import { supabase } from '../../db/supabase';
import { logger } from '../../config/logger';
import { getSocketIO } from '../realtime/socket.server';

export class AbuseDetectionService {
  /**
   * Reports a driver violation and executes the warning → temporary block → admin review escalation path.
   */
  async reportViolation(
    driverId: string,
    violationType: string,
    description: string,
    orderId?: string
  ): Promise<void> {
    try {
      // 1. Fetch driver info
      const { data: drv, error: drvErr } = await supabase
        .from('drivers')
        .select('full_name, phone, warning_count')
        .eq('id', driverId)
        .maybeSingle();

      if (drvErr || !drv) {
        logger.error(`[abuse-detection] Driver ${driverId} not found for reporting violation:`, drvErr?.message);
        return;
      }

      const currentWarnings = drv.warning_count || 0;
      const nextWarnings = currentWarnings + 1;
      const now = new Date();

      logger.warn(`[abuse-detection] Reporting violation for driver ${driverId} (${drv.full_name}): type=${violationType}, next_warning_count=${nextWarnings}`);

      const io = getSocketIO();

      if (nextWarnings <= 2) {
        // --- ESCALATION LEVEL 1: WARNING ---
        await supabase
          .from('drivers')
          .update({
            warning_count: nextWarnings,
            last_suspicious_activity: `${violationType}: ${description} (${now.toISOString()})`,
            updated_at: now.toISOString()
          })
          .eq('id', driverId);

        // Emit warnings
        io?.to(`driver:${driverId}`).emit('driver:warning', {
          message: `Avertissement (${nextWarnings}/3): ${description}. L'activité suspecte a été signalée.`,
          warning_count: nextWarnings
        });
        io?.to('admin:dashboard').emit('driver:warning', {
          driver_id: driverId,
          full_name: drv.full_name,
          warning_count: nextWarnings,
          type: violationType,
          message: `Le livreur ${drv.full_name} a reçu un avertissement (${nextWarnings}/3) pour : ${description}`
        });

      } else if (nextWarnings === 3) {
        // --- ESCALATION LEVEL 2: TEMPORARY BLOCK (1 HOUR) ---
        const suspensionUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour block

        await supabase
          .from('drivers')
          .update({
            warning_count: nextWarnings,
            suspension_until: suspensionUntil,
            state: 'OFFLINE',
            is_online: false, // force offline
            last_suspicious_activity: `${violationType}: ${description} (Temp Block 1h) (${now.toISOString()})`,
            updated_at: now.toISOString()
          })
          .eq('id', driverId);

        // Emit suspension alerts
        io?.to(`driver:${driverId}`).emit('driver:suspended', {
          message: `Votre compte a été temporairement suspendu pour 1 heure suite à 3 avertissements. Raison : ${description}`,
          suspension_until: suspensionUntil
        });
        io?.to('admin:dashboard').emit('driver:alert', {
          driver_id: driverId,
          full_name: drv.full_name,
          type: 'temporary_block',
          message: `Le livreur ${drv.full_name} a été suspendu temporairement pour 1 heure (3 avertissements reached).`
        });

      } else {
        // --- ESCALATION LEVEL 3: ADMIN REVIEW / PERMANENT BLOCK ---
        const permanentSuspension = '9999-12-31T23:59:59.999Z';

        await supabase
          .from('drivers')
          .update({
            warning_count: nextWarnings,
            suspension_until: permanentSuspension,
            state: 'OFFLINE',
            is_online: false, // force offline
            is_active: false, // deactivate driver
            last_suspicious_activity: `${violationType}: ${description} (Perm Block) (${now.toISOString()})`,
            updated_at: now.toISOString()
          })
          .eq('id', driverId);

        // Fetch user_id for ticket database constraints
        let userId: string | null = null;
        if (orderId) {
          const { data: ord } = await supabase.from('orders').select('user_id').eq('id', orderId).maybeSingle();
          if (ord) userId = ord.user_id;
        }

        if (!userId) {
          // Fallback to the first user in the database to satisfy the foreign key constraint
          const { data: usr } = await supabase.from('users').select('id').limit(1).maybeSingle();
          if (usr) userId = usr.id;
        }

        if (userId) {
          try {
            await supabase.from('support_requests').insert({
              user_id: userId,
              category: 'delivery_issue',
              urgency: 'high',
              subject: `Alerte Abus Livreur: Examen Admin requis`,
              message: `Le livreur ${drv.full_name || 'Inconnu'} (${drv.phone || 'N/A'}) a été suspendu de façon permanente. Il a dépassé le seuil de 3 avertissements. Dernière infraction : ${violationType} - ${description}. Historique : ${nextWarnings} avertissements au total.`,
              order_id: orderId || null,
              status: 'open',
              ref_number: `TKT-AB-${Date.now().toString().slice(-6)}`
            });
          } catch (tktErr: any) {
            logger.error('[abuse-detection] Failed to insert admin review support request:', tktErr.message);
          }
        }

        // Emit suspension alerts
        io?.to(`driver:${driverId}`).emit('driver:suspended', {
          message: `Votre compte a été suspendu de manière permanente pour abus répétés. Contactez le support.`,
          suspension_until: permanentSuspension
        });
        io?.to('admin:dashboard').emit('driver:alert', {
          driver_id: driverId,
          full_name: drv.full_name,
          type: 'permanent_block',
          message: `Le livreur ${drv.full_name} a été bloqué de manière permanente pour examen admin.`
        });
      }
    } catch (err: any) {
      logger.error('[abuse-detection] Error processing driver violation:', err.message);
    }
  }
}
