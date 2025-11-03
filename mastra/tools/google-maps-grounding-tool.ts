import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * Google Maps Grounding tool (via Gemini GenerateContent)
 * Inputs: { latitude, longitude, query?, enableWidget?, model? }
 * Outputs: returns the raw Gemini response (including groundingMetadata when present)
 * Requires environment variable GEMINI_API_KEY to be set.
 */

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Allowed Gemini models (comma-separated env or default to DEFAULT_MODEL)
const ALLOWED_GEMINI_MODELS = (process.env.GEMINI_ALLOWED_MODELS || DEFAULT_MODEL)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export const googleMapsGroundingTool = createTool({
  id: 'google-maps-grounding',
  description:
    'Universal Google Maps Grounding tool for Gemini. Accepts either coordinates or a postal/address string and returns grounding results (normalized).\n\nExamples:\n1) By coordinates:\n{\n  "latitude": 51.107163,\n  "longitude": 71.426414,\n  "query": "детские сады рядом"\n}\n2) By address:\n{\n  "address": "бул Мухаммед Бин Рашид, дом 1",\n  "query": "детские сады рядом"\n}\nNote: If `address` is provided, the tool will geocode it to coordinates before calling Gemini. Requires `GEMINI_API_KEY` in env.',
  inputSchema: z
    .object({
      latitude: z.number().optional().describe('Latitude of the location (e.g. 51.107163)'),
      longitude: z.number().optional().describe('Longitude of the location (e.g. 71.426414)'),
      address: z.string().optional().describe('Human-readable address; if provided, tool will geocode it'),
      query: z
        .string()
        .optional()
        .describe('Search query, e.g., "schools near me" or in Russian: "детские сады рядом"'),
      enableWidget: z.boolean().optional().describe('Whether to request a widget token'),
      model: z.string().optional().describe('Gemini model to use'),
      limit: z.number().optional().describe('Max number of place candidates to return (best-effort)'),
      radiusMeters: z.number().optional().describe('Search radius in meters (optional)'),
    })
    .refine((v) => (typeof v.address === 'string' && v.address.length > 0) || (v.latitude !== undefined && v.longitude !== undefined), {
      message: 'Either address or both latitude and longitude must be provided',
    }),
  outputSchema: z.object({
    raw: z.any(),
    candidates: z.any().optional(),
    places: z
      .array(
        z.object({
          title: z.string().optional(),
          uri: z.string().optional(),
          placeId: z.string().optional(),
          snippet: z.string().optional(),
          startIndex: z.number().optional(),
          endIndex: z.number().optional(),
        }),
      )
      .optional(),
    googleMapsWidgetContextToken: z.string().optional(),
    groundingSupports: z.any().optional(),
    usedModel: z.string().optional(),
    error: z.string().optional(),
  }),
  execute: async ({ context }) => {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required for googleMapsGroundingTool');
    }

    let latitude = context.latitude !== undefined ? Number(context.latitude) : undefined;
    let longitude = context.longitude !== undefined ? Number(context.longitude) : undefined;
    const address = context.address as string | undefined;
    const query = (context.query as string) || 'Find nearby kindergartens and schools';
    const enableWidget = Boolean(context.enableWidget);
    // Enforce only allowed Gemini models to be used for generateContent
    const requestedModel = String(context.model || '').trim();
    const model = ALLOWED_GEMINI_MODELS.includes(requestedModel)
      ? requestedModel || DEFAULT_MODEL
      : DEFAULT_MODEL;
    // If address provided, geocode it using Yandex public geocode endpoint (no dependency on other tools)
    if (address && address.length > 0 && (!Number.isFinite(latitude) || !Number.isFinite(longitude))) {
      const apikey = process.env.YANDEX_GEOCODE_API_KEY || '766f3792-fcd9-40e9-999e-cda31620cbc6';
      const geocodeUrl = `https://geocode-maps.yandex.ru/v1/?apikey=${encodeURIComponent(apikey)}&geocode=${encodeURIComponent(
        address,
      )}&format=json`;
      const gres = await fetch(geocodeUrl);
      if (!gres.ok) {
        throw new Error(`Yandex geocode failed: ${gres.status} ${gres.statusText}`);
      }
      const gdata = await gres.json();
      const featureMember = gdata?.response?.GeoObjectCollection?.featureMember?.[0];
      const geoObject = featureMember?.GeoObject;
      const pos = geoObject?.Point?.pos || '';
      const [lonStr, latStr] = pos.split(' ');
      latitude = parseFloat(latStr);
      longitude = parseFloat(lonStr);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new Error('Failed to geocode address to valid coordinates');
      }
    }

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new Error('latitude and longitude must be valid numbers (or provide an address)');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model,
    )}:generateContent`;

    const body: any = {
      contents: [
        {
          role: 'user',
          parts: [{ text: query }],
        },
      ],
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: { latitude, longitude },
        },
      },
    };

    if (enableWidget) {
      // signal we want widget token (tool-specific option)
      body.tools = [{ googleMaps: { enableWidget: true } }];
    }

    let usedModel = model;
    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY,
        },
        body: JSON.stringify(body),
      });
    } catch (e: any) {
      return {
        raw: null,
        candidates: undefined,
        places: undefined,
        googleMapsWidgetContextToken: undefined,
        groundingSupports: undefined,
        usedModel,
        error: String(e?.message || e),
      };
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return {
        raw: null,
        candidates: undefined,
        places: undefined,
        googleMapsWidgetContextToken: undefined,
        groundingSupports: undefined,
        usedModel,
        error: `Gemini generateContent failed: ${res.status} ${res.statusText} ${text}`,
      };
    }

    const data = await res.json();

    // Normalize groundingMetadata -> places array when available
    const candidates = data?.candidates || [];
    const places: Array<any> = [];
    let googleMapsWidgetContextToken: string | undefined;
    const groundingSupports: Array<any> = [];
    for (const c of candidates) {
      const gm = c?.groundingMetadata;
      if (gm?.googleMapsWidgetContextToken && !googleMapsWidgetContextToken) {
        googleMapsWidgetContextToken = gm.googleMapsWidgetContextToken;
      }
      const chunks = gm?.groundingChunks || [];
      const supports = gm?.groundingSupports || [];
      if (supports && supports.length) {
        for (const s of supports) {
          groundingSupports.push(s);
        }
      }
      for (const ch of chunks) {
        const maps = ch?.maps || ch;
        if (maps) {
          places.push({
            title: maps.title || maps.name || undefined,
            uri: maps.uri || maps.googleMapsUri || undefined,
            placeId: maps.placeId || maps.id || undefined,
            snippet: maps.snippet || undefined,
          });
        }
      }
    }

    return {
      raw: data,
      candidates,
      places: places.length ? places : undefined,
      googleMapsWidgetContextToken,
      groundingSupports: groundingSupports.length ? groundingSupports : undefined,
    };
  },
});
