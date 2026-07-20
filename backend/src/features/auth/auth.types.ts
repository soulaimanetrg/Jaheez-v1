export interface AdminTokenPayload {
  id: string;
  email: string;
  role: string;
  kind: 'admin';
  last_seen: number;
  abs_exp: number;
  remember_me: boolean;
}

export interface DriverTokenPayload {
  driver_id: string;
  user_id?: string;
  phone: string;
  kind: 'driver';
  sub?: string;
  actor?: 'driver';
  cin?: string;
}

