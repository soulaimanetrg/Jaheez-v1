import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '../../..');

describe('route security contract', () => {
  it('does not expose unauthenticated public store review creation', () => {
    const storeRoutes = readFileSync(resolve(root, 'backend/src/features/store/store.routes.ts'), 'utf8');
    const customerRoutes = readFileSync(resolve(root, 'backend/src/features/customer/customer.routes.ts'), 'utf8');

    expect(storeRoutes).not.toContain("router.post('/reviews'");
    expect(customerRoutes).toContain("router.use('/v1/customer', verifyCustomerJwt)");
    expect(customerRoutes).toContain("req.path.startsWith('/errands/')");
    expect(customerRoutes).toContain("router.post('/v1/customer/orders/:orderId/reviews'");
  });

  it('keeps OTP provider credentials server-side and requires signed hooks', () => {
    const app = readFileSync(resolve(root, 'backend/src/app.ts'), 'utf8');
    const hooks = readFileSync(resolve(root, 'backend/src/features/auth/whatsappOtpHooks.ts'), 'utf8');
    const mobileAuth = readFileSync(resolve(root, 'frontend/user-app/features/auth/services/authApi.ts'), 'utf8');
    expect(app).toContain("express.raw({ type: 'application/json'");
    expect(hooks).toContain("env.SUPABASE_SEND_SMS_HOOK_SECRET.split(',').pop()");
    expect(hooks).toContain('new Webhook(hookSecret).verify');
    expect(hooks).toContain("req.headers['x-webhook-signature']");
    expect(mobileAuth).not.toContain('WASENDER_SESSION_API_KEY');
    expect(mobileAuth).not.toContain('RESEND_API_KEY');
    expect(mobileAuth).toContain("'/admin-api/auth/register'");
    expect(mobileAuth).not.toContain('Math.random');
    expect(mobileAuth).not.toContain('verifyOtp(');
  });

  it('keeps every checkout preview behind customer JWT, limits, and strict schemas', () => {
    const routes = readFileSync(resolve(root, 'backend/src/features/order/customerOrder.routes.ts'), 'utf8');
    expect(routes).toContain("'/v1/checkout/line-preview'");
    expect(routes).toContain('checkoutLinePreviewLimiter');
    expect(routes).toContain('validate(checkoutLinePreviewSchema)');
    expect(routes).toContain('checkoutPreviewLimiter');
    expect(routes).toContain('checkoutCreateLimiter');
  });
});
