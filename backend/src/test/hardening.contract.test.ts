import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '../../..');
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

/**
 * Locks the 2026-07 security/logic hardening in place:
 *  - no confirmation-code bypass routes for pickup/deliver
 *  - fail-closed ban checks (HTTP + socket)
 *  - driver token revocation on both transports
 *  - per-role signing secrets
 *  - windowed review-flag instead of lifetime auto-ban
 *  - guarded stall reassignment
 */
describe('hardening contract', () => {
  it('drivers cannot change order status without the stage endpoint (confirmation codes enforced)', () => {
    const driverOrderRoutes = read('backend/src/features/order/driverOrder.routes.ts');
    expect(driverOrderRoutes).not.toContain("'/v1/orders/:id/pickup'");
    expect(driverOrderRoutes).not.toContain("'/v1/orders/:id/deliver'");
    expect(driverOrderRoutes).toContain("'/v1/orders/:id/accept'");

    const checkoutService = read('backend/src/features/order/checkout.service.ts');
    expect(checkoutService).not.toContain('async pickupOrder');
    expect(checkoutService).not.toContain('async deliverOrder');

    // The hardened path stays wired and validates codes before transitioning.
    const driverRoutes = read('backend/src/features/driver/driver.routes.ts');
    expect(driverRoutes).toContain("'/driver/orders/:id/stage'");
    const lifecycle = read('backend/src/features/order/orderLifecycle.service.ts');
    expect(lifecycle).toContain("validateStageConfirmationCode(orderId, driverId, 'pickup', code)");
    expect(lifecycle).toContain("validateStageConfirmationCode(orderId, driverId, 'delivery', code)");
  });

  it('customer ban checks fail closed on lookup errors (HTTP and socket)', () => {
    const middleware = read('backend/src/middleware/supabaseJwt.middleware.ts');
    const banBlock = middleware.slice(middleware.indexOf('Enforce ban and existence validation'));
    expect(banBlock).toContain("next(new UnauthorizedError('Vérification du compte impossible', 'auth_verification_failed'))");
    expect(banBlock).not.toMatch(/if \(profileErr\) \{\s*console\.error[^}]*\}\s*else/);

    const realtime = read('backend/src/features/realtime/realtime.service.ts');
    expect(realtime).toContain("if (profileErr) throw new Error('auth_verification_failed')");
    expect(realtime).toContain("if (profileRow.is_banned) throw new Error('account_disabled')");
  });

  it('driver tokens are revocable on both HTTP and socket transports', () => {
    const driverMiddleware = read('backend/src/middleware/driver.middleware.ts');
    expect(driverMiddleware).toContain('isDriverActive(payload.driver_id)');
    expect(driverMiddleware).toContain("'account_disabled'");

    const realtime = read('backend/src/features/realtime/realtime.service.ts');
    expect(realtime).toContain('await isDriverActive(payload.driver_id)');

    // Deactivating a driver purges the cached status for instant lockout.
    const adminService = read('backend/src/features/admin/admin.service.ts');
    expect(adminService).toContain('invalidateDriverActiveCache(id)');

    // The status helper itself must fail closed.
    const driverStatus = read('backend/src/utils/driverStatus.ts');
    expect(driverStatus).toContain("throw new Error('driver_status_lookup_failed')");
  });

  it('driver tokens and OTP hashing use dedicated secrets when provisioned', () => {
    const jwtUtils = read('backend/src/utils/jwt.ts');
    expect(jwtUtils).toContain('env.DRIVER_JWT_SECRET || env.ADMIN_JWT_SECRET');
    expect(jwtUtils).toContain('jwt.sign(tokenPayload, DRIVER_JWT_SECRET');
    expect(jwtUtils).toContain('jwt.verify(token, DRIVER_JWT_SECRET)');

    const hooks = read('backend/src/features/auth/whatsappOtpHooks.ts');
    expect(hooks).toContain('env.OTP_HASH_SECRET || env.ADMIN_JWT_SECRET');

    const envConfig = read('backend/src/config/env.ts');
    expect(envConfig).toContain('DRIVER_JWT_SECRET');
    expect(envConfig).toContain('OTP_HASH_SECRET');
    expect(envConfig).toContain('ADMIN_JWT_SECRET must be at least 32 characters');
  });

  it('cancellations flag for admin review in a window; only admins ban', () => {
    const checkoutService = read('backend/src/features/order/checkout.service.ts');
    expect(checkoutService).toContain('getRecentCancelledOrdersCount');
    expect(checkoutService).toContain('CANCELLATION_REVIEW_WINDOW_DAYS');
    expect(checkoutService).not.toContain('banUser');

    const checkoutRepo = read('backend/src/features/order/checkout.repository.ts');
    expect(checkoutRepo).toContain("auth_risk_level: 'high'");
    expect(checkoutRepo).toContain(".neq('auth_risk_level', 'blocked')");
    expect(checkoutRepo).not.toContain('is_banned: true');
  });

  it('automatic stall reassignment cannot stomp a progressing order', () => {
    const lifecycle = read('backend/src/features/order/orderLifecycle.service.ts');
    expect(lifecycle).toContain('updateOrderGuarded');
    expect(lifecycle).toContain(".eq('driver_id', expectedDriverId)");
    expect(lifecycle).toContain(".in('status', allowedFromStatuses)");
    expect(lifecycle).toContain("['confirmed', 'preparing']");

    // Manual admin pull-back of a picked_up order stays an explicit opt-in.
    const adminService = read('backend/src/features/admin/admin.service.ts');
    expect(adminService).toContain("allowedFromStatuses: ['confirmed', 'preparing', 'picked_up']");
  });

  it('financial finalization has a retry sweep and promo/claim accounting is atomic', () => {
    // Outbox worker re-drives the idempotent finalize RPC for delivered
    // orders whose commission recording failed inline.
    const worker = read('backend/src/workers/commissionRetry.worker.ts');
    expect(worker).toContain('listUnfinalizedDeliveredOrders');
    expect(worker).toContain('finalizeDeliveredOrder');
    const server = read('backend/src/server.ts');
    expect(server).toContain('startCommissionRetryWorker()');
    const commissionRepo = read('backend/src/features/commission/commission.repository.ts');
    expect(commissionRepo).toContain(".is('financial_finalized_at', null)");

    // Promo usage joins the order transaction; post-commit path is
    // legacy-signature fallback only.
    const migration = read('supabase_migrations/055_atomic_promo_and_claim_offer.sql');
    expect(migration).toContain('p_promo_id');
    expect(migration).toContain('promo_exhausted');
    expect(migration).toContain('INSERT INTO public.user_promo_usages');
    const checkoutService = read('backend/src/features/order/checkout.service.ts');
    expect(checkoutService).toContain('promoId: quote.appliedPromoId');
    expect(checkoutService).toContain('!order.promo_atomic');

    // Claim RPC validates the offer under the row lock and clears it there.
    expect(migration).toContain('v_order.offered_driver_id <> v_driver_uuid');
    expect(migration).toContain('v_order.offer_expires_at < NOW()');
    expect(migration).toContain('record_driver_claim_metrics');
    const lifecycle = read('backend/src/features/order/orderLifecycle.service.ts');
    expect(lifecycle).toContain("supabase.rpc('record_driver_claim_metrics'");
  });

  it('provider OTP delivery is frozen by default, at every layer, without deleting the providers', () => {
    // Frozen-by-default env flag: only an explicit 'false' unfreezes.
    const envConfig = read('backend/src/config/env.ts');
    expect(envConfig).toContain('OTP_DELIVERY_FROZEN');
    expect(envConfig).toContain(".default(true)");

    // Layer 1: the Supabase send-SMS hook refuses before touching secrets.
    const hooks = read('backend/src/features/auth/whatsappOtpHooks.ts');
    expect(hooks).toContain('if (env.OTP_DELIVERY_FROZEN) return res.status(503)');

    // Layer 2: the sender factory returns an inert sender.
    const sender = read('backend/src/features/auth/whatsappOtpSender.ts');
    expect(sender).toContain('FrozenOtpSender');
    expect(sender).toContain("throw new Error('otp_delivery_frozen')");
    // Providers are frozen, not deleted.
    expect(sender).toContain('class WasenderOtpSender');
    expect(sender).toContain('class MetaOtpSender');

    // Layer 3: driver login skips the OTP challenge instead of locking
    // drivers out, and the Twilio client refuses outbound calls.
    const driverAuthService = read('backend/src/features/auth/driverAuth.service.ts');
    expect(driverAuthService).toContain('if (env.OTP_DELIVERY_FROZEN) return this.sessionResult(driver)');
    expect(driverAuthService).toMatch(/twilioRequest[\s\S]{0,200}OTP_DELIVERY_FROZEN/);
  });

  it('dispatch zones and checkout fees are data-driven, not hardcoded', () => {
    // Zone adjacency lives in delivery_zones.neighbor_zone_ids.
    const engine = read('backend/src/features/dispatch/assignmentEngine.ts');
    expect(engine).toContain('neighbor_zone_ids');
    expect(engine).not.toContain('المدينة القديمة');
    expect(engine).toContain('env.DEFAULT_MAP_LATITUDE');
    const migration = read('supabase_migrations/056_zone_neighbors_and_service_fee.sql');
    expect(migration).toContain('neighbor_zone_ids UUID[]');
    expect(migration).toContain('checkout_service_fee_centimes');

    // Service fee comes from app_settings with a bounded fallback.
    const checkoutService = read('backend/src/features/order/checkout.service.ts');
    expect(checkoutService).not.toContain('CHECKOUT_SERVICE_FEE_DH = 2');
    expect(checkoutService).toContain('getServiceFeeDh()');
    const checkoutRepo = read('backend/src/features/order/checkout.repository.ts');
    expect(checkoutRepo).toContain("eq('key', 'checkout_service_fee_centimes')");

    // Upload route requires an explicit content-capable role.
    const uploadRoutes = read('backend/src/features/admin/upload.routes.ts');
    expect(uploadRoutes).toContain("requireRole('super_admin', 'operations', 'content_manager')");
  });

  it('rate limiting shares state across instances and trusts exactly one proxy hop', () => {
    const rateLimitMiddleware = read('backend/src/middleware/rateLimit.middleware.ts');
    expect(rateLimitMiddleware).toContain('RedisStore');
    expect(rateLimitMiddleware).toContain('rl:${this.limiterName}:');
    // Redis being down must never take requests down with it.
    expect(rateLimitMiddleware).toContain('memoryStore.increment(key)');

    const app = read('backend/src/app.ts');
    expect(app).toContain("if (env.JAHEEZ_TARGET_ENV === 'staging' || env.NODE_ENV === 'production') app.set('trust proxy', 1)");
  });
});
