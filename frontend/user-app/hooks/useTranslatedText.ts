/**
 * Data text safety helper.
 *
 * Store names, product names, addresses, customer names, and order item names
 * are database/user content, not UI chrome. They must be rendered exactly as
 * supplied by the backend and must not be sent to external translation services.
 */
export function useTranslatedText(text: string | undefined | null): string {
  return text ?? '';
}

export function useTranslatedRecord<T extends Record<string, string>>(
  record: T | null | undefined,
): T {
  return record ?? ({} as T);
}
