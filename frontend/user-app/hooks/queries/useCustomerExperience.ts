import { useQuery } from '@tanstack/react-query';
import { getCustomerHomeFeed } from '../../lib/customerExperienceApi';

export const customerExperienceKeys = {
  all: () => ['customer-experience'] as const,
  homeFeed: () => ['customer-experience', 'home-feed'] as const,
};

export function useCustomerHomeFeed() {
  return useQuery({
    queryKey: customerExperienceKeys.homeFeed(),
    queryFn: () => getCustomerHomeFeed(),
    staleTime: 60 * 1000,
  });
}
