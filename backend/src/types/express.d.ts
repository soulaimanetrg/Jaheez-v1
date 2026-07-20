import { AdminTokenPayload, DriverTokenPayload } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      admin?: AdminTokenPayload;
      driver?: DriverTokenPayload;
      storePartner?: { credentialId: string; storeId: string; scopes: string[] };
      supabaseUser?: {
        id: string;
        email?: string;
        role?: string;
      };
    }
  }
}
export {};
