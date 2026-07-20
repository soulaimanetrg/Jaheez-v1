import { beforeEach, describe, expect, it, vi } from 'vitest';

const repoMock = {
  getAllStores: vi.fn(),
  getMenuQueryMatches: vi.fn(),
  getStoresWithActivePromotions: vi.fn(),
};

vi.mock('../features/store/store.repository', () => ({
  StoreRepository: vi.fn(function StoreRepositoryMock() {
    return repoMock;
  }),
  SUB_CAT_TRANSLATIONS: {
    'pizza': ['pizza', 'بيتزا'],
    'سريع': ['fast', 'burger', 'سريع', 'سناك', 'snack'],
    'rapide': ['fast', 'burger', 'سريع', 'سناك', 'snack'],
  },
}));

import { StoreService } from '../features/store/store.service';

describe('StoreService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repoMock.getAllStores.mockResolvedValue([
      {
        id: 'store-1',
        name: 'Burger King',
        name_ar: 'برجر كينج',
        logo_url: null,
        category: 'food',
        cuisine_tags: ['burger', 'fast'],
        rating_avg: 4.5,
        delivery_time_min: 20,
        delivery_time_max: 30,
        delivery_fee: 10,
        lat: 32.2,
        lng: -9.2,
        is_featured: true,
        is_open: true,
        address: 'Safi',
        address_ar: 'آسفي',
        store_capacity_state: 'OPEN',
      },
      {
        id: 'store-2',
        name: 'Marjane',
        name_ar: 'مرجان',
        logo_url: null,
        category: 'grocery',
        cuisine_tags: ['supermarket'],
        rating_avg: 4.8,
        delivery_time_min: 30,
        delivery_time_max: 50,
        delivery_fee: 15,
        lat: 32.21,
        lng: -9.21,
        is_featured: false,
        is_open: true,
        address: 'Safi',
        address_ar: 'آسفي',
        store_capacity_state: 'OPEN',
      },
    ]);
    repoMock.getMenuQueryMatches.mockResolvedValue(new Set());
    repoMock.getStoresWithActivePromotions.mockResolvedValue(new Set());
  });

  it('filters stores by category', async () => {
    const service = new StoreService();
    const results = await service.getStores({ category: 'food' });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('store-1');
  });

  it('filters stores by query', async () => {
    const service = new StoreService();
    const results = await service.getStores({ query: 'Marjane' });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('store-2');
  });

  it('calculates distance when lat and lng are provided', async () => {
    const service = new StoreService();
    const results = await service.getStores({ lat: 32.2, lng: -9.2 });
    expect(results[0].distance).toBe(0); // exactly at store-1 coords
  });

  it('filters by featured flag', async () => {
    const service = new StoreService();
    const results = await service.getStores({ is_featured: true });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('store-1');
  });

  it('filters by sub-category using new translation keys like rapide', async () => {
    const service = new StoreService();
    const results = await service.getStores({ sub_category: 'rapide' });
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('store-1');
  });

  it('does not treat the all/tous UI label as a sub-category filter', async () => {
    const service = new StoreService();
    const results = await service.getStores({ category: 'food', sub_category: 'Tous' });

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('store-1');
    expect(repoMock.getMenuQueryMatches).not.toHaveBeenCalled();
  });

  it('keeps promotion filtering owned by the backend service', async () => {
    repoMock.getStoresWithActivePromotions.mockResolvedValue(new Set(['store-1']));

    const service = new StoreService();
    const results = await service.getStores({ category: 'food', sort: 'promotions' });

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('store-1');
  });

  it('sorts low delivery fees in the backend service', async () => {
    repoMock.getAllStores.mockResolvedValue([
      {
        id: 'food-expensive',
        name: 'Expensive Food',
        name_ar: 'مطعم غالي',
        logo_url: null,
        category: 'food',
        cuisine_tags: ['food'],
        rating_avg: 4.9,
        delivery_time_min: 25,
        delivery_time_max: 35,
        delivery_fee: 15,
        lat: null,
        lng: null,
        is_featured: false,
        is_open: true,
        address: 'Safi',
        address_ar: 'آسفي',
        store_capacity_state: 'OPEN',
      },
      {
        id: 'food-cheap',
        name: 'Cheap Food',
        name_ar: 'مطعم اقتصادي',
        logo_url: null,
        category: 'food',
        cuisine_tags: ['food'],
        rating_avg: 4.1,
        delivery_time_min: 25,
        delivery_time_max: 35,
        delivery_fee: 0,
        lat: null,
        lng: null,
        is_featured: false,
        is_open: true,
        address: 'Safi',
        address_ar: 'آسفي',
        store_capacity_state: 'OPEN',
      },
    ]);

    const service = new StoreService();
    const results = await service.getStores({ category: 'food', sort: 'fee' });

    expect(results.map(store => store.id)).toEqual(['food-cheap', 'food-expensive']);
  });
});
