import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const appRoot = resolve(__dirname, '..');
const read = (path: string) => readFileSync(resolve(appRoot, path), 'utf8');

describe('unified customer authentication contract', () => {
  it('uses one automatic continuation flow without sign-in or registration selectors', () => {
    const screen = read('features/auth/views/UnifiedAuthScreen.tsx');
    expect(screen).toContain('continueCustomerAuth');
    expect(screen).toContain("result.data.continuation === 'password_challenge'");
    expect(screen).toContain("animateTo('otp')");
    expect(screen).not.toContain('AuthPath');
    expect(screen).not.toContain('pathTabs');
    expect(screen).not.toContain('resetForPath');
    expect(screen).not.toContain('scenario=new');
  });

  it('uses the real backend OTP contract and never verifies OTP in the frontend', () => {
    const api = read('features/auth/services/authApi.ts');
    expect(api).toContain("'/admin-api/auth/continue'");
    expect(api).toContain("'/admin-api/auth/register/verify'");
    expect(api).toContain("'/admin-api/auth/register/resend'");
    expect(api).toContain('continuation_token:continuationToken');
    expect(api).not.toContain("'/admin-api/auth/register/start'");
    expect(api).toContain('registration_proof: input.registrationProof');
    expect(api).not.toContain('verifyOtp(');
    expect(api).not.toContain('Math.random');
  });

  it('makes login and register routes converge on the same stable screen', () => {
    const login = read('app/(auth)/login.tsx');
    const register = read('app/(auth)/register.tsx');
    expect(login).toContain('<UnifiedAuthScreen />');
    expect(register).toContain('<UnifiedAuthScreen />');
    expect(register).not.toContain('initialPath');
  });

  it('removes the demo route and obsolete promotional welcome screen', () => {
    const welcomeRoute = read('app/(auth)/welcome.tsx');
    expect(existsSync(resolve(appRoot, 'app/(auth)/auth-preview.tsx'))).toBe(false);
    expect(welcomeRoute).toContain('<Redirect href="/(auth)/login"');
    expect(welcomeRoute).not.toContain('Tout ce qu');
  });
});
