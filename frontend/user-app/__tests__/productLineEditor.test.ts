import {
  productSelectionsAreValid,
  restoreProductSelections,
  selectProductChoice,
} from '@/features/orders/productLineEditor';
import type { MenuItemOption } from '@shared/types';

const groups: MenuItemOption[] = [
  { id: 'size', label: 'Size', label_ar: '', required: true, multiple: false, min_selections: 1, max_selections: 1, choices: [{ id: 'large', label: 'Large', label_ar: '', price_delta_dh: 5 }] },
  { id: 'sauce', label: 'Sauce', label_ar: '', required: false, multiple: true, min_selections: 0, max_selections: 1, choices: [{ id: 'hot', label: 'Hot', label_ar: '', price_delta_dh: 0 }, { id: 'mild', label: 'Mild', label_ar: '', price_delta_dh: 0 }] },
  { id: 'other', label: 'Other', label_ar: '', required: false, multiple: true, min_selections: 0, max_selections: 1, choices: [{ id: 'hot', label: 'Also hot', label_ar: '', price_delta_dh: 0 }] },
];

describe('product supplement editor', () => {
  it('restores the exact cart selection by group and choice', () => {
    expect(restoreProductSelections(groups, [
      { option_id: 'sauce', choice_id: 'hot' },
      { option_id: 'other', choice_id: 'hot' },
    ])).toEqual({ size: ['large'], sauce: ['hot'], other: ['hot'] });
  });

  it('enforces single and multiple maximum selection rules', () => {
    const first = selectProductChoice({}, groups[1], 'hot');
    expect(selectProductChoice(first, groups[1], 'mild')).toBe(first);
    expect(selectProductChoice({}, groups[0], 'large')).toEqual({ size: ['large'] });
  });

  it('allows an optional single-choice group to return to no selection', () => {
    const optionalSingle: MenuItemOption = {
      ...groups[0], required: false, min_selections: 0,
    };
    const selected = selectProductChoice({}, optionalSingle, 'large');
    expect(selectProductChoice(selected, optionalSingle, 'large')).toEqual({ size: [] });
  });

  it('validates required minimums without calculating prices', () => {
    expect(productSelectionsAreValid(groups, {})).toBe(false);
    expect(productSelectionsAreValid(groups, { size: ['large'] })).toBe(true);
  });
});
