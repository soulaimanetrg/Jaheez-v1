import { env } from '../../config/env';
import { ForbiddenError } from '../../middleware/error.middleware';

type GoogleAddressComponent = { long_name?: string; types?: string[] };
type GoogleResult = { formatted_address?: string; place_id?: string; address_components?: GoogleAddressComponent[]; geometry?: { location?: { lat?: number; lng?: number } } };

function cityOf(result: GoogleResult): string {
  const wanted = ['locality', 'administrative_area_level_2', 'administrative_area_level_1'];
  for (const type of wanted) {
    const component = result.address_components?.find((item) => item.types?.includes(type));
    if (component?.long_name) return component.long_name;
  }
  return '';
}

export class CustomerLocationService {
  private async geocode(params: URLSearchParams): Promise<GoogleResult[]> {
    if (!env.GOOGLE_MAPS_SERVER_API_KEY) throw new ForbiddenError('Location search is not configured.', 'location_provider_unavailable');
    params.set('key', env.GOOGLE_MAPS_SERVER_API_KEY);
    params.set('region', 'ma');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    try {
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`, { signal: controller.signal });
      if (!response.ok) throw new Error('provider unavailable');
      const body = await response.json() as { status?: string; results?: GoogleResult[] };
      if (!['OK', 'ZERO_RESULTS'].includes(body.status || '')) throw new Error('provider rejected request');
      return body.results || [];
    } catch {
      throw new ForbiddenError('Location search is temporarily unavailable.', 'location_provider_unavailable');
    } finally {
      clearTimeout(timeout);
    }
  }

  config() {
    if (env.DEFAULT_MAP_LATITUDE == null || env.DEFAULT_MAP_LONGITUDE == null) {
      throw new ForbiddenError('Location is not configured.', 'location_provider_unavailable');
    }
    return { initial_region: { latitude: env.DEFAULT_MAP_LATITUDE, longitude: env.DEFAULT_MAP_LONGITUDE, latitude_delta: 0.04, longitude_delta: 0.04 } };
  }

  async reverse(latitude: number, longitude: number) {
    const [result] = await this.geocode(new URLSearchParams({ latlng: `${latitude},${longitude}`, language: 'fr' }));
    return result ? { city: cityOf(result), address: result.formatted_address || '', area: cityOf(result) || result.formatted_address || '', place_id: result.place_id || null } : null;
  }

  async search(query: string) {
    if (!env.GOOGLE_MAPS_SERVER_API_KEY) throw new ForbiddenError('Location search is not configured.', 'location_provider_unavailable');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    try {
      const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': env.GOOGLE_MAPS_SERVER_API_KEY,
          'X-Goog-FieldMask': 'places.id,places.formattedAddress,places.location,places.addressComponents',
        },
        body: JSON.stringify({ textQuery: query, languageCode: 'fr', regionCode: 'MA', maxResultCount: 5 }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error('provider rejected request');
      const body = await response.json() as any;
      return (body.places || []).map((place:any) => ({
        place_id: String(place.id || ''),
        label: String(place.formattedAddress || ''),
        city: String(place.addressComponents?.find((item:any) => item.types?.includes('locality'))?.longText || ''),
        latitude: Number(place.location?.latitude),
        longitude: Number(place.location?.longitude),
      })).filter((item:any) => item.label && Number.isFinite(item.latitude) && Number.isFinite(item.longitude));
    } catch {
      throw new ForbiddenError('Location search is temporarily unavailable.', 'location_provider_unavailable');
    } finally { clearTimeout(timeout); }
  }
}
