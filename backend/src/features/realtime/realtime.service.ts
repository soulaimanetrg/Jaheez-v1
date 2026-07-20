import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { verifyAdminToken, verifyDriverToken } from '../../utils/jwt';
import { isDriverActive } from '../../utils/driverStatus';
import { RealtimeRepository } from './realtime.repository';

export interface RealtimePrincipal {
  actorType: 'customer' | 'driver' | 'admin';
  userId?: string;
  driverId?: string;
  adminId?: string;
  role?: string;
  email?: string;
  phone?: string;
  // Legacy fields kept for backward compatibility
  kind: 'customer' | 'driver' | 'admin';
  id?: string;
  driver_id?: string;
  user_id?: string;
}

export class RealtimeService {
  private repo = new RealtimeRepository();

  async verifyToken(token: string, requestedKind: string): Promise<RealtimePrincipal> {
    if (requestedKind === 'admin') {
      const payload = verifyAdminToken(token);
      return {
        actorType: 'admin',
        adminId: payload.id,
        role: payload.role,
        email: payload.email,
        kind: 'admin',
        id: payload.id,
      };
    }

    if (requestedKind === 'driver') {
      const payload = verifyDriverToken(token);
      // Same revocation rule as the HTTP driverAuth middleware: a
      // deactivated driver must not keep a live socket principal.
      if (!(await isDriverActive(payload.driver_id))) {
        throw new Error('driver_account_disabled');
      }
      return {
        actorType: 'driver',
        driverId: payload.driver_id,
        userId: payload.user_id,
        phone: payload.phone,
        kind: 'driver',
        driver_id: payload.driver_id,
        user_id: payload.user_id,
      };
    }

    if (requestedKind === 'customer') {
      let userId: string;
      let email: string | undefined;
      if (env.SUPABASE_JWT_SECRET) {
        const payload = jwt.verify(token, env.SUPABASE_JWT_SECRET) as any;
        userId = payload.sub;
        email = payload.email;
      } else {
        const { supabase } = await import('../../db/supabase');
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
          throw new Error('invalid_supabase_token');
        }
        userId = user.id;
        email = user.email;
      }

      // Mirror the HTTP middleware's ban/existence check (fail closed).
      const { supabase } = await import('../../db/supabase');
      const { data: profileRow, error: profileErr } = await supabase
        .from('users')
        .select('is_banned')
        .eq('id', userId)
        .maybeSingle();
      if (profileErr) throw new Error('auth_verification_failed');
      if (!profileRow) throw new Error('user_not_found');
      if (profileRow.is_banned) throw new Error('account_disabled');

      return {
        actorType: 'customer',
        userId,
        email,
        kind: 'customer',
        user_id: userId,
      };
    }

    throw new Error('unknown_actor_type');
  }

  async canJoinRoom(principal: RealtimePrincipal, room: string): Promise<boolean> {
    if (room === 'admin:dashboard') {
      return principal.kind === 'admin' && principal.role !== undefined && ['super_admin', 'operations', 'finance', 'support'].includes(principal.role);
    }

    const driverMatch = /^driver:([0-9a-f-]{8,})$/i.exec(room);
    if (driverMatch) {
      return principal.kind === 'driver' && principal.driver_id === driverMatch[1];
    }

    const orderMatch = /^order:([0-9a-f-]{8,})$/i.exec(room);
    if (!orderMatch) return false;

    const order = await this.repo.getOrderAccess(orderMatch[1]);
    if (!order) return false;
    if (principal.kind === 'customer') return order.user_id === principal.user_id;
    if (principal.kind === 'driver') return order.driver_id === principal.driver_id;
    return principal.kind === 'admin';
  }
}
