import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/*
  Yandex Geocode tool
  - input: { address: string }
  - output: { latitude, longitude, formatted, raw }
  The API key can be provided via YANDEX_GEOCODE_API_KEY env var, otherwise falls back to the key that was provided in the request.
*/

const DEFAULT_API_KEY = process.env.YANDEX_GEOCODE_API_KEY || '766f3792-fcd9-40e9-999e-cda31620cbc6';

export const yandexGeocodeTool = createTool({
  id: 'yandex-geocode',
  description: 'Resolve an address to coordinates using Yandex Geocode API',
  inputSchema: z.object({
    address: z.string().describe('Address or place to geocode'),
  }),
  outputSchema: z.object({
    latitude: z.number(),
    longitude: z.number(),
    formatted: z.string(),
    raw: z.any(),
  }),
  execute: async ({ context }) => {
    const address = context.address as string;
    if (!address) throw new Error('address is required');

    const apikey = DEFAULT_API_KEY;
    const url = `https://geocode-maps.yandex.ru/v1/?apikey=${encodeURIComponent(apikey)}&geocode=${encodeURIComponent(
      address,
    )}&format=json`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Yandex Geocode request failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();

    // Try to extract the first feature's coordinates and name
    try {
      const featureMember = data?.response?.GeoObjectCollection?.featureMember?.[0];
      const geoObject = featureMember?.GeoObject;
      const name = geoObject?.name || geoObject?.metaDataProperty?.GeocoderMetaData?.text || address;
      const pos = geoObject?.Point?.pos || '';
      const [lonStr, latStr] = pos.split(' ');
      const latitude = parseFloat(latStr);
      const longitude = parseFloat(lonStr);

      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        return {
          latitude,
          longitude,
          formatted: name,
          raw: data,
        };
      }
    } catch (e) {
      // fall through to returning raw if parsing failed
    }

    // If parsing failed, throw with some diagnostic
    throw new Error('Failed to parse Yandex Geocode response or no results found');
  },
});
