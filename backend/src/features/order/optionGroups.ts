export type CanonicalOptionChoice = {
  id: string;
  label: string;
  label_ar: string;
  price_delta_dh: number;
};

export type CanonicalOptionGroup = {
  id: string;
  label: string;
  label_ar: string;
  required: boolean;
  multiple: boolean;
  min_selections: number;
  max_selections: number;
  choices: CanonicalOptionChoice[];
};

type UnknownRecord = Record<string, unknown>;

export class OptionConfigurationError extends Error {
  constructor(public readonly errorCode = 'option_configuration_invalid') {
    super(errorCode);
  }
}

function record(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as UnknownRecord
    : null;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function identifier(value: unknown): string {
  const result = text(value);
  if (!/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,119}$/.test(result)) {
    throw new OptionConfigurationError();
  }
  return result;
}

function selectionInteger(value: unknown, fallback: number): number {
  if (value === undefined || value === null || value === '') return fallback;
  const result = Number(value);
  if (!Number.isInteger(result)) throw new OptionConfigurationError();
  return result;
}

function price(value: unknown): number {
  const result = Number(value ?? 0);
  if (!Number.isFinite(result) || result < 0 || result > 10_000) {
    throw new OptionConfigurationError('option_pricing_unavailable');
  }
  return Number(result.toFixed(2));
}

function unwrapGroups(raw: unknown): unknown[] {
  let parsed = raw;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed) as unknown;
    } catch {
      throw new OptionConfigurationError();
    }
  }
  if (Array.isArray(parsed)) return parsed;
  const object = record(parsed);
  if (!object) return parsed === null || parsed === undefined ? [] : (() => { throw new OptionConfigurationError(); })();
  return Array.isArray(object.groups) ? object.groups : [];
}

export function normalizeOptionGroups(raw: unknown): CanonicalOptionGroup[] {
  const groups = unwrapGroups(raw);
  if (groups.length > 30) throw new OptionConfigurationError();

  const groupIds = new Set<string>();
  return groups.map((rawGroup) => {
    const group = record(rawGroup);
    if (!group) throw new OptionConfigurationError();
    const id = identifier(group.id);
    if (groupIds.has(id)) throw new OptionConfigurationError('duplicate_option_group');
    groupIds.add(id);

    const rawChoices = Array.isArray(group.choices)
      ? group.choices
      : Array.isArray(group.options)
        ? group.options
        : Array.isArray(group.items)
          ? group.items
          : [];
    if (rawChoices.length > 50) throw new OptionConfigurationError();

    const choiceIds = new Set<string>();
    const choices = rawChoices.map((rawChoice) => {
      const choice = record(rawChoice);
      if (!choice) throw new OptionConfigurationError();
      const choiceId = identifier(choice.id);
      if (choiceIds.has(choiceId)) throw new OptionConfigurationError('duplicate_option_choice');
      choiceIds.add(choiceId);
      return {
        id: choiceId,
        label: text(choice.label) || text(choice.name) || text(choice.nameEn),
        label_ar: text(choice.label_ar) || text(choice.name_ar) || text(choice.nameAr),
        price_delta_dh: price(choice.price_delta_dh ?? choice.price_delta ?? choice.price ?? choice.extra),
      };
    });

    const required = group.required === true || group.type === 'required';
    const multiple = group.multiple === true;
    const defaultMin = required ? 1 : 0;
    const defaultMax = multiple ? Math.min(choices.length, 20) : 1;
    const minSelections = selectionInteger(group.min_selections, defaultMin);
    const maxSelections = selectionInteger(group.max_selections, defaultMax);

    if (choices.length === 0) {
      if (required || minSelections !== 0) throw new OptionConfigurationError();
    } else if (
      minSelections < 0
      || maxSelections < 1
      || maxSelections > Math.min(choices.length, 20)
      || minSelections > maxSelections
      || (!multiple && (maxSelections !== 1 || minSelections !== defaultMin))
      || (required && minSelections < 1)
    ) {
      throw new OptionConfigurationError();
    }

    return {
      id,
      label: text(group.label) || text(group.name) || text(group.nameEn),
      label_ar: text(group.label_ar) || text(group.name_ar) || text(group.nameAr),
      required,
      multiple,
      min_selections: minSelections,
      max_selections: choices.length === 0 ? 0 : maxSelections,
      choices,
    };
  });
}
