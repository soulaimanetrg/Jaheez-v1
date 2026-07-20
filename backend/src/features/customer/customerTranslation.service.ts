import { env } from '../../config/env';
import { ForbiddenError } from '../../middleware/error.middleware';

type TranslationInput = { texts: string[]; source: 'ar'|'fr'|'en'; target: 'ar'|'fr'|'en' };

export class CustomerTranslationService {
  async translate(input: TranslationInput) {
    if (!env.MODERNMT_API_KEY) throw new ForbiddenError('Translation is not configured.', 'translation_unavailable');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch('https://api.modernmt.com/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'MMT-ApiKey': env.MODERNMT_API_KEY },
        body: JSON.stringify({ q: input.texts, source: input.source, target: input.target }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error('provider rejected request');
      const body = await response.json() as any;
      const rows = Array.isArray(body?.data?.translations)
        ? body.data.translations.map((item:any) => String(item?.translation || ''))
        : [String(body?.data?.translation || '')];
      if (rows.length !== input.texts.length) throw new Error('invalid provider response');
      return { translations: rows };
    } catch {
      throw new ForbiddenError('Translation is temporarily unavailable.', 'translation_unavailable');
    } finally { clearTimeout(timeout); }
  }
}
