type AddressSuggestionPayload = {
  query?: string;
  language?: string;
};

type AddressSuggestion = {
  street: string;
  city: string;
  postalCode: string;
  label: string;
};

type CacheEntry = {
  expiresAt: number;
  suggestions: AddressSuggestion[];
};

const ALLOWED_ORIGINS = new Set([
  "https://rentulo-seven.vercel.app",
  "https://rentulo.eu",
  "https://www.rentulo.eu",
  "http://localhost:3000",
  "http://localhost:5500",
  "http://127.0.0.1:5500"
]);

const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 120;
const cache = new Map<string, CacheEntry>();

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://rentulo-seven.vercel.app";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin"
  };
}

function jsonResponse(
  body: unknown,
  status: number,
  origin: string | null
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...getCorsHeaders(origin),
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

function cleanText(value: unknown, maxLength: number): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function normalizeLanguage(value: unknown): string {
  const language = cleanText(value, 5).toLowerCase();
  return ["cs", "en", "de", "pl"].includes(language) ? language : "cs";
}

function normalizePostalCode(value: unknown): string {
  const raw = cleanText(value, 16);
  const digits = raw.replace(/\D/g, "");

  if (digits.length === 5) {
    return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  }

  return raw;
}

function buildStreet(properties: Record<string, unknown>): string {
  const streetName = cleanText(properties.street || properties.name, 140);
  const houseNumber = cleanText(properties.housenumber, 24);

  if (!streetName) {
    return "";
  }

  if (!houseNumber || streetName.includes(houseNumber)) {
    return streetName;
  }

  return `${streetName} ${houseNumber}`;
}

function buildCity(properties: Record<string, unknown>): string {
  return cleanText(
    properties.city ||
      properties.town ||
      properties.village ||
      properties.municipality ||
      properties.locality,
    100
  );
}

function mapPhotonFeatures(data: unknown): AddressSuggestion[] {
  const features = Array.isArray((data as { features?: unknown[] })?.features)
    ? (data as { features: unknown[] }).features
    : [];
  const suggestions: AddressSuggestion[] = [];
  const seen = new Set<string>();

  for (const feature of features) {
    const properties =
      feature && typeof feature === "object" &&
      (feature as { properties?: unknown }).properties &&
      typeof (feature as { properties: unknown }).properties === "object"
        ? ((feature as { properties: Record<string, unknown> }).properties)
        : {};

    const street = buildStreet(properties);
    const city = buildCity(properties);
    const postalCode = normalizePostalCode(properties.postcode);

    if (!street || !city || !postalCode) {
      continue;
    }

    const dedupeKey = `${street}|${city}|${postalCode}`.toLocaleLowerCase("cs-CZ");

    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);
    suggestions.push({
      street,
      city,
      postalCode,
      label: `${street}, ${city}, ${postalCode}`
    });

    if (suggestions.length >= 5) {
      break;
    }
  }

  return suggestions;
}

function readCache(key: string): AddressSuggestion[] | null {
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }

  return entry.suggestions;
}

function writeCache(key: string, suggestions: AddressSuggestion[]): void {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) {
      cache.delete(oldestKey);
    }
  }

  cache.set(key, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    suggestions
  });
}

async function fetchWithTimeout(url: string, timeoutMs = 4500): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "Rentulo/1.0 (https://rentulo.eu)"
      }
    });
  } finally {
    clearTimeout(timeout);
  }
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");

  if (req.method === "OPTIONS") {
    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return jsonResponse({ error: "Origin not allowed" }, 403, origin);
    }

    return new Response("ok", {
      headers: getCorsHeaders(origin)
    });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, origin);
  }

  if (!origin || !ALLOWED_ORIGINS.has(origin)) {
    return jsonResponse({ error: "Origin not allowed" }, 403, origin);
  }

  let payload: AddressSuggestionPayload;

  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400, origin);
  }

  const query = cleanText(payload.query, 120);
  const language = normalizeLanguage(payload.language);

  if (query.length < 3) {
    return jsonResponse({ suggestions: [] }, 200, origin);
  }

  const cacheKey = `${language}|${query.toLocaleLowerCase("cs-CZ")}`;
  const cached = readCache(cacheKey);

  if (cached) {
    return jsonResponse({ suggestions: cached }, 200, origin);
  }

  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "8");
  url.searchParams.set("countrycode", "CZ");
  url.searchParams.append("layer", "house");
  url.searchParams.append("layer", "street");
  url.searchParams.set("lang", language);

  try {
    const response = await fetchWithTimeout(url.toString());

    if (!response.ok) {
      console.warn("address-suggestions: Photon returned", response.status);
      return jsonResponse({ suggestions: [] }, 200, origin);
    }

    const data = await response.json();
    const suggestions = mapPhotonFeatures(data);
    writeCache(cacheKey, suggestions);

    return jsonResponse({ suggestions }, 200, origin);
  } catch (error) {
    console.warn(
      "address-suggestions: Photon request failed",
      error instanceof Error ? error.message : String(error)
    );
    return jsonResponse({ suggestions: [] }, 200, origin);
  }
});
