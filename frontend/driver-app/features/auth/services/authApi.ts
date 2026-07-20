import { req, Driver } from '@/lib/api';

export const loginDriver = (cin: string, password: string) =>
  req<{ token: string; driver: Driver }>('/driver/login', { method: 'POST', body: JSON.stringify({ cin, password }) });
