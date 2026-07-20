export interface CustomerSession {
  access_token: string;
  refresh_token?: string;
}

import { secureStorage } from './secureStorage';

const ACCESS_TOKEN_KEY = 'jaheez-customer-access-token';
const REFRESH_TOKEN_KEY = 'jaheez-customer-refresh-token';

export async function persistCustomerSession(session: CustomerSession | null | undefined) {
  if (!session?.access_token) {
    await clearCustomerSession();
    return;
  }
  await secureStorage.setItem(ACCESS_TOKEN_KEY, session.access_token);
  if (session.refresh_token) {
    await secureStorage.setItem(REFRESH_TOKEN_KEY, session.refresh_token);
  }
}

export async function getCustomerAccessToken(): Promise<string | null> {
  return secureStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function clearCustomerSession() {
  await Promise.all([
    secureStorage.removeItem(ACCESS_TOKEN_KEY),
    secureStorage.removeItem(REFRESH_TOKEN_KEY),
  ]);
}
