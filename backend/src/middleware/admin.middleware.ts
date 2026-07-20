import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from './error.middleware';
import { AdminRepository } from '../features/admin/admin.repository';

const adminRepository = new AdminRepository();

/**
 * Require specific admin roles. Logs a forbidden action in the audit logs if denied.
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin || !roles.includes(req.admin.role)) {
      const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '')
        .toString()
        .split(',')[0]
        .trim() || null;

      // Asynchronous audit log tracking (non-blocking)
      (async () => {
        try {
          await adminRepository.writeAuditLog({
            admin_id: req.admin?.id || null,
            admin_email: req.admin?.email || null,
            action: 'role_forbidden',
            entity_type: 'auth',
            summary: `${req.method} ${req.originalUrl || req.url}`,
            new_value: {
              current_role: req.admin?.role || null,
              required_roles: roles,
            },
            ip,
          });
        } catch (err: any) {
          console.error('[audit role_forbidden]', err.message);
        }
      })();

      return next(new ForbiddenError('Permission insuffisante pour cette action', 'role_forbidden'));
    }
    next();
  };
}
