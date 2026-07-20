/**
 * Shared admin types — replaces @workspace/api-client-react types
 */

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  parentId?: string | null;
  sortOrder?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Driver = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  vehicleType?: string;
  isOnline: boolean;
  isVerified: boolean;
  isBanned: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  city?: string;
  rating?: number;
  totalDeliveries?: number;
};

export type AdminDriverDocument = {
  id: string;
  driverId: string;
  type: string;
  fileUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
};

export type Store = {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  city?: string;
  category?: string;
  isActive: boolean;
  isOpen: boolean;
  rating?: number;
  tags?: string[];
  logo?: string;
  opening_hours?: any;
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  promo_price?: number | null;
  promo_until?: string | null;
  storeId: string;
  categoryId?: string;
  image?: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Promotion = {
  id: string;
  title: string;
  code?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  maxUses?: number;
  usedCount?: number;
  isActive: boolean;
  startsAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type SupportTicket = {
  id: string;
  userId: string;
  userName?: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  replies?: SupportReply[];
};

export type SupportReply = {
  id: string;
  ticketId: string;
  message: string;
  isAdmin: boolean;
  createdAt: string;
};

export type AuditLogEntry = {
  id: string;
  adminId: string;
  adminEmail?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
};

export type OrderStatus = "pending" | "confirmed" | "preparing" | "assigned" | "picked_up" | "on_the_way" | "delivered" | "cancelled";
