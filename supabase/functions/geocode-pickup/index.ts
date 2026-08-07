import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type GeocodePayload = {
  city?: string;
  postalCode?: string;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function cleanAddressPart(value: unknown, maxLength: number): string {
  return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !anonKey) {
    return jsonResponse({ error: "Missing server configuration" }, 500);
  }

  const authHeader = req.headers.get("Authorization") || "";
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser();

  if (userError || !userData.user) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  let payload: GeocodePayload;

  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const city = cleanAddressPart(payload.city, 120);
  const postalCode = cleanAddressPart(payload.postalCode, 24);

  if (!city || !postalCode) {
    return jsonResponse({ error: "Incomplete pickup location" }, 400);
  }

  const query = [postalCode, city, "Česko"].join(", ");
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "cz");

  let geocodeResponse: Response;

  try {
    geocodeResponse = await fetch(url.toString(), {
      headers: {
        "Accept": "application/json",
        "Accept-Language": "cs",
        "User-Agent": "Rentulo/1.0 (https://rentulo-seven.vercel.app)",
      },
    });
  } catch {
    return jsonResponse({ ok: false, reason: "unavailable" }, 503);
  }

  if (!geocodeResponse.ok) {
    return jsonResponse({ ok: false, reason: "unavailable" }, 503);
  }

  const results = await geocodeResponse.json().catch(() => []);
  const first = Array.isArray(results) ? results[0] : null;
  const latitude = Number(first?.lat);
  const longitude = Number(first?.lon);

  if (!first || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return jsonResponse({ ok: false, reason: "not_found" });
  }

  return jsonResponse({
    ok: true,
    latitude,
    longitude,
  });
});
