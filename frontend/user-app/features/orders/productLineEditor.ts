import type { CheckoutLinePreview, MenuItemOption, SelectedOption } from '@shared/types';

export type ProductSelections = Record<string, string[]>;

export function restoreProductSelections(
  groups: MenuItemOption[],
  selectedOptions: Array<Partial<SelectedOption> & { id?: string }> = [],
): ProductSelections {
  const restored: ProductSelections = {};
  for (const selected of selectedOptions) {
    const choiceId = selected.choice_id || selected.id;
    const group = groups.find((candidate) => candidate.id === selected.option_id);
    if (!choiceId || !group?.choices.some((choice) => choice.id === choiceId)) continue;
    restored[group.id] = [...(restored[group.id] || []), choiceId];
  }
  for (const group of groups) {
    if ((restored[group.id] || []).length === 0 && group.min_selections > 0 && group.choices[0]) {
      restored[group.id] = [group.choices[0].id];
    }
  }
  return restored;
}

export function selectProductChoice(
  selections: ProductSelections,
  group: MenuItemOption,
  choiceId: string,
): ProductSelections {
  if (!group.choices.some((choice) => choice.id === choiceId)) return selections;
  if (!group.multiple) {
    const isSelected = (selections[group.id] || []).includes(choiceId);
    return { ...selections, [group.id]: isSelected && group.min_selections === 0 ? [] : [choiceId] };
  }
  const current = selections[group.id] || [];
  if (current.includes(choiceId)) {
    return { ...selections, [group.id]: current.filter((id) => id !== choiceId) };
  }
  if (current.length >= group.max_selections) return selections;
  return { ...selections, [group.id]: [...current, choiceId] };
}

export function productSelectionsAreValid(groups: MenuItemOption[], selections: ProductSelections): boolean {
  return groups.every((group) => {
    const count = (selections[group.id] || []).length;
    return count >= group.min_selections && count <= group.max_selections;
  });
}

export function linePreviewCartOptions(preview: CheckoutLinePreview | null, groups: MenuItemOption[]): SelectedOption[] {
  return preview?.item.options.map((option) => {
    const group = groups.find((candidate) => candidate.id === option.option_id);
    const choice = group?.choices.find((candidate) => candidate.id === option.choice_id);
    const french = choice?.label || option.choice_name;
    const arabic = choice?.label_ar || french;
    return {
      option_id: option.option_id,
      choice_id: option.choice_id,
      choice_name: arabic === french ? french : `${arabic}|${french}`,
      price_delta: option.price_delta_dh,
    };
  }) || [];
}
