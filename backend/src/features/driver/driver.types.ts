export type VehicleType = 'bike' | 'motorcycle' | 'car' | 'van';

export interface DriverUpdateInput {
  full_name?: string;
  phone?: string;
  vehicle_type?: VehicleType;
  vehicle_plate?: string;
  city?: string;
  is_online?: boolean;
  current_lat?: number;
  current_lng?: number;
  heading?: number;
}
