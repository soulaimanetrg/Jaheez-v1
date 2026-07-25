import { describe, expect, it } from 'vitest';
import { normalizeOptionGroups } from '../features/order/optionGroups';

describe('canonical product option groups', () => {
  it('normalizes legacy items without discarding stable IDs', () => {
    expect(normalizeOptionGroups([{
      id: 'size',
      name: 'Taille | Size',
      name_ar: 'الحجم',
      type: 'required',
      items: [{ id: 'large', name: 'Grande | Large', name_ar: 'كبير', price: 5 }],
    }])).toEqual([{
      id: 'size',
      label: 'Taille | Size',
      label_ar: 'الحجم',
      required: true,
      multiple: false,
      min_selections: 1,
      max_selections: 1,
      choices: [{ id: 'large', label: 'Grande | Large', label_ar: 'كبير', price_delta_dh: 5 }],
    }]);
  });

  it.each([
    [[{ id: 'g', required: true, choices: [] }]],
    [[{ id: 'g', multiple: false, min_selections: 0, max_selections: 2, choices: [{ id: 'a' }, { id: 'b' }] }]],
    [[{ id: 'g', multiple: true, min_selections: 2, max_selections: 1, choices: [{ id: 'a' }, { id: 'b' }] }]],
    [[{ id: 'g', choices: [{ id: 'a', price_delta_dh: Number.NaN }] }]],
    [[{ id: 'g', choices: [{ id: 'a' }, { id: 'a' }] }]],
    [[{ id: 'g', choices: [{ id: 'a' }] }, { id: 'g', choices: [{ id: 'b' }] }]],
  ])('rejects malformed configuration %#', (groups) => {
    expect(() => normalizeOptionGroups(groups)).toThrow();
  });

  it('supports required and optional multiple selection bounds', () => {
    const groups = normalizeOptionGroups([
      { id: 'sauces', required: true, multiple: true, min_selections: 1, max_selections: 2, choices: [{ id: 'a' }, { id: 'b' }] },
      { id: 'extras', required: false, multiple: true, min_selections: 0, max_selections: 1, choices: [{ id: 'c' }] },
    ]);
    expect(groups.map((group) => [group.min_selections, group.max_selections])).toEqual([[1, 2], [0, 1]]);
  });
});
