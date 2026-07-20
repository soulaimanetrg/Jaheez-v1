import { backendJson } from '@/lib/backendApi';

export interface SupportRequest {
  id: string;
  user_id: string;
  category: string;
  urgency: string;
  subject: string;
  message: string;
  order_id: string | null;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  ref_number: string;
  created_at: string;
}

export async function createSupportTicket(input: {
  user_id: string;
  category: string;
  urgency: string;
  subject: string;
  message: string;
  order_id?: string;
}): Promise<{ data: SupportRequest | null; error: string | null }> {
  try {
    const data = await backendJson<SupportRequest>('/admin-api/v1/customer/support-tickets', {
      method: 'POST',
      body: JSON.stringify({
        category: input.category,
        urgency: input.urgency,
        subject: input.subject,
        message: input.message,
        order_id: input.order_id?.trim() || null,
      }),
    });
    return { data, error: null };
  } catch (e: any) {
    return { data: null, error: e.message ?? 'فشل إرسال التذكرة' };
  }
}

export async function getUserSupportTickets(userId: string): Promise<{ data: SupportRequest[]; error: string | null }> {
  try {
    const data = await backendJson<SupportRequest[]>('/admin-api/v1/customer/support-tickets');
    return { data: data ?? [], error: null };
  } catch {
    return { data: [], error: null };
  }
}
