import { beforeEach, describe, expect, it, vi } from 'vitest';

const repoMock = {
  getPromotions: vi.fn(),
  getActivePromotions: vi.fn(),
  getStoreNames: vi.fn(),
  createPromotion: vi.fn(),
  updatePromotion: vi.fn(),
  validatePromo: vi.fn(),
  writeAuditLog: vi.fn(),
};

vi.mock('../features/settings/settings.repository', () => ({
  SettingsRepository: vi.fn(function SettingsRepositoryMock() {
    return repoMock;
  }),
}));

import { SettingsService } from '../features/settings/settings.service';

const context = { adminId: 'admin-1', adminEmail: 'admin@test.local', ip: '127.0.0.1' };

describe('SettingsService promotion DH DTO boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns promotion money as DH DTO fields without exposing min_order_centimes', async () => {
    repoMock.getPromotions.mockResolvedValue([
      {
        id: 'promo-1',
        title_ar: 'Promo',
        code: 'PROMO',
        discount_type: 'fixed',
        discount_value: 1250,
        min_order_centimes: 5000,
        store_id: 'store-1',
      },
    ]);
    repoMock.getStoreNames.mockResolvedValue({ 'store-1': 'Store A' });

    const rows = await new SettingsService().getPromotions();

    expect(rows[0]).toMatchObject({
      discount_value: 12.5,
      min_order_dh: 50,
      store_name: 'Store A',
    });
    expect(rows[0]).not.toHaveProperty('min_order_centimes');
  });

  it('converts admin DH promotion payload to centimes only inside repository writes', async () => {
    repoMock.createPromotion.mockImplementation(async (payload) => ({
      id: 'promo-1',
      ...payload,
    }));

    const result = await new SettingsService().createPromotion({
      title_ar: 'Fixed DH',
      code: 'FIXED',
      discount_type: 'fixed',
      discount_value: '12.50',
      min_order_dh: '50',
    }, context);

    expect(repoMock.createPromotion).toHaveBeenCalledWith(expect.objectContaining({
      discount_type: 'fixed',
      discount_value: 1250,
      min_order_centimes: 5000,
    }));
    expect(result).toMatchObject({
      discount_value: 12.5,
      min_order_dh: 50,
    });
    expect(result).not.toHaveProperty('min_order_centimes');
  });

  it('validates promotions with order_total_dh and returns discount_amount_dh', async () => {
    repoMock.validatePromo.mockResolvedValue({
      id: 'promo-1',
      title_ar: 'Ten percent',
      discount_type: 'percentage',
      discount_value: 10,
      min_order_centimes: 5000,
    });

    const result = await new SettingsService().validatePromo({
      code: 'TEN',
      store_id: 'store-1',
      order_total_dh: '100.00',
    });

    expect(result).toMatchObject({
      valid: true,
      discount_value: 10,
      discount_amount_dh: 10,
    });
    expect(result).not.toHaveProperty('discount_amount');
  });

  it('rejects promo validation without DH total', async () => {
    await expect(new SettingsService().validatePromo({ code: 'TEN' })).rejects.toThrow('order_total_dh');
  });
});
