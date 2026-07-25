import type { MenuItemOption } from '@shared/types';

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as UnknownRecord
    : null;
}

function text(...values: unknown[]): string {
  const match = values.find((value) => typeof value === 'string' && value.trim());
  return typeof match === 'string' ? match.trim() : '';
}

export function normalizeMobileOptionGroups(raw: unknown): MenuItemOption[] {
  const source = Array.isArray(raw) ? raw : [];
  return source.flatMap((rawGroup) => {
    const group = asRecord(rawGroup);
    if (!group || !text(group.id)) return [];
    const rawChoices = Array.isArray(group.choices)
      ? group.choices
      : Array.isArray(group.options)
        ? group.options
        : Array.isArray(group.items)
          ? group.items
          : [];
    const required = group.required === true || group.type === 'required';
    const rawMax = Number.isInteger(group.max_selections) ? Number(group.max_selections) : null;
    // multiple if explicitly flagged OR max_selections allows more than 1
    // Also detect supplements: non-required groups with only additive (non-zero priced) choices
    const explicitMultiple = group.multiple === true || (rawMax !== null && rawMax > 1);
    const choices = rawChoices.flatMap((rawChoice) => {
      const choice = asRecord(rawChoice);
      if (!choice || !text(choice.id)) return [];
      const delta = Number(choice.price_delta_dh ?? choice.price_delta ?? choice.price ?? 0);
      if (!Number.isFinite(delta) || delta < 0) return [];
      return [{
        id: text(choice.id),
        label: text(choice.label, choice.name),
        label_ar: text(choice.label_ar, choice.name_ar),
        price_delta_dh: delta,
      }];
    });
    // Supplement heuristic: non-required group where every choice has a price > 0 (pure additive extras)
    const isSupplementPattern = !required && !explicitMultiple && choices.length > 0
      && choices.every((c) => c.price_delta_dh > 0);
    const multiple = explicitMultiple || isSupplementPattern;
    const min = Number.isInteger(group.min_selections) ? Number(group.min_selections) : required ? 1 : 0;
    const max = rawMax !== null
      ? rawMax
      : multiple ? Math.min(choices.length, 20) : 1;
    return [{
      id: text(group.id),
      label: text(group.label, group.name),
      label_ar: text(group.label_ar, group.name_ar),
      required,
      multiple,
      min_selections: min,
      max_selections: max,
      choices,
    }];
  });
}

export function optionSelectionKey(groupId: string, choiceId: string): string {
  return `${groupId}:${choiceId}`;
}
