import { useQuery } from '@tanstack/react-query';
import { backendJson } from '@/lib/backendApi';

export interface AppContentRow {
  slug: string;
  type: 'faq' | 'terms' | 'privacy' | 'about';
  titleFr: string;
  titleAr: string;
  bodyFr: string;
  bodyAr: string;
  position: number;
  isActive: boolean;
  updatedAt: string;
}

async function fetchAppContent(type?: 'faq' | 'terms' | 'privacy' | 'about'): Promise<AppContentRow[]> {
  try {
    const data = await backendJson<AppContentRow[]>(`/admin-api/content/public${type ? `?type=${type}` : ''}`);
    return data.filter(row => row.isActive).sort((a, b) => a.position - b.position);
  } catch {
    return [];
  }
}

export function useAppContent(type?: 'faq' | 'terms' | 'privacy' | 'about') {
  return useQuery<AppContentRow[]>({
    queryKey: ['app-content', type],
    queryFn: () => fetchAppContent(type),
    staleTime: 5 * 60 * 1000,
    placeholderData: [],
  });
}
