import { SupportRepository } from './support.repository';
import { NotFoundError, BadRequestError } from '../../middleware/error.middleware';

export class SupportService {
  private repo = new SupportRepository();

  async getSupportTickets() {
    const data = await this.repo.getSupportTickets();
    const urgencyOrder: Record<string, number> = { urgent: 1, high: 2, normal: 3, low: 4 };

    return data
      .map((sr: any) => ({
        ...sr,
        description: sr.description || sr.message || '',
        user_name: sr.users?.full_name || '',
        user_phone: sr.users?.phone || '',
      }))
      .sort((a: any, b: any) => {
        const orderA = urgencyOrder[a.urgency] || 4;
        const orderB = urgencyOrder[b.urgency] || 4;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }

  async updateSupportTicket(id: string, payload: any) {
    const status = payload.status;
    const adminNote = payload.admin_note ?? payload.adminNote;
    const allowed = ['open', 'in_progress', 'resolved', 'closed'];
    if (status !== undefined && !allowed.includes(status)) {
      throw new BadRequestError('Invalid ticket status');
    }

    const ticket = await this.repo.findSupportTicketById(id);
    if (!ticket) {
      throw new NotFoundError('Ticket introuvable');
    }

    const updates: any = {};
    if (status !== undefined) updates.status = status;
    if (adminNote !== undefined) updates.admin_note = adminNote;
    if (Object.keys(updates).length === 0) return { ok: true };

    await this.repo.updateSupportTicket(id, updates);
    return { ok: true };
  }

  async getDriverIssues(status?: string) {
    const rows = await this.repo.getJsonSetting<any[]>('driver_issues', []);
    if (status && status !== 'all') {
      return rows.filter(row => row.status === status);
    }
    return rows;
  }

  async updateDriverIssue(id: string, payload: any) {
    const rows = await this.repo.getJsonSetting<any[]>('driver_issues', []);
    const index = rows.findIndex(row => row.id === id);
    if (index === -1) {
      throw new NotFoundError('Signalement chauffeur introuvable');
    }
    rows[index] = {
      ...rows[index],
      status: payload.status ?? rows[index].status,
      resolution_note: payload.resolution_note ?? payload.resolutionNote ?? rows[index].resolution_note,
      updated_at: new Date().toISOString(),
    };
    await this.repo.setJsonSetting('driver_issues', rows);
    return rows[index];
  }

  async getStoreReviews() {
    const rows = await this.repo.getStoreReviews();
    const storeIds = [...new Set(rows.map(r => r.store_id).filter(Boolean))];
    const storeNames = storeIds.length ? await this.repo.getStoreNames(storeIds) : {};

    return rows.map(r => ({
      ...r,
      store_name: r.store_id ? storeNames[r.store_id] || null : null,
    }));
  }

  async updateReviewVisibility(id: string, isVisible: boolean) {
    if (typeof isVisible !== 'boolean') {
      throw new BadRequestError('is_visible is required');
    }

    const review = await this.repo.findReviewById(id);
    if (!review) {
      throw new NotFoundError('Avis introuvable');
    }

    await this.repo.updateReviewVisibility(id, isVisible);
    await this.recalcStoreRating(review.store_id);

    return { ok: true };
  }

  private async recalcStoreRating(storeId: string) {
    if (!storeId) return;
    try {
      const ratings = await this.repo.getRatingsForStore(storeId);
      if (ratings.length > 0) {
        const sum = ratings.reduce((acc, r) => acc + r, 0);
        const avg = Math.round((sum / ratings.length) * 10) / 10;
        await this.repo.updateStoreRating(storeId, avg, ratings.length);
      } else {
        await this.repo.updateStoreRating(storeId, 0, 0);
      }
    } catch (err: any) {
      console.error('[SupportService] recalcStoreRating failed:', err.message);
    }
  }
}
