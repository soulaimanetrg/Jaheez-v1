import { Platform } from 'react-native';
import { backendJson } from './backendApi';
import type {
  CustomerAnalyticsEventInput,
  CustomerHomeFeed,
} from '@shared/types';

function analyticsPlatform(): CustomerAnalyticsEventInput['platform'] {
  return Platform.OS === 'ios' || Platform.OS === 'android' || Platform.OS === 'web'
    ? Platform.OS
    : 'unknown';
}

export async function getCustomerHomeFeed(params?: {
  lat?: number;
  lng?: number;
}): Promise<CustomerHomeFeed> {
  const query = new URLSearchParams();
  if (typeof params?.lat === 'number') query.set('lat', String(params.lat));
  if (typeof params?.lng === 'number') query.set('lng', String(params.lng));

  const suffix = query.toString() ? `?${query.toString()}` : '';
  return backendJson<CustomerHomeFeed>(`/admin-api/v1/customer/home-feed${suffix}`);
}

export async function trackCustomerEvent(input: CustomerAnalyticsEventInput): Promise<void> {
  try {
    await backendJson<{ ok: boolean }>('/admin-api/v1/customer/analytics/events', {
      method: 'POST',
      body: JSON.stringify({
        ...input,
        platform: input.platform || analyticsPlatform(),
      }),
    });
  } catch {
    // Analytics is intentionally non-blocking for customer journeys.
  }
}
