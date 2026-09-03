// @ts-nocheck — this file runs on Deno (Supabase Edge Functions), not Node.
// The editor's Node/TS server can't resolve `Deno` or the https: imports, so it
// would show false errors; the build already excludes supabase/functions.
//
// OnePort Agency — vessel-lookup Edge Function.
// Auto-fills the "Create Vessel Record" form from live AIS data (VesselAPI —
// https://vesselapi.com) once a signed-in user types an IMO number, vessel
// name, or call sign. Keeps the VesselAPI key server-side; the browser only
// ever calls this function.
//
// Deploy:  supabase functions deploy vessel-lookup
// Secret:  supabase secrets set VESSELAPI_KEY=your_free_vesselapi_key
//          (sign up for a free key at https://dashboard.vesselapi.com/)
//
// Any signed-in user may call this — it only reads public AIS vessel data,
// nothing org-scoped or sensitive.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VESSELAPI_KEY = Deno.env.get('VESSELAPI_KEY') ?? '';
const VESSELAPI_BASE = 'https://api.vesselapi.com/v1';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

// Our fixed "Vessel Type" dropdown options — map whatever free-text type
// VesselAPI returns onto the closest one of these, so the <select> in the
// form lands on a real match instead of staying on its default.
const KNOWN_TYPES: [string, string][] = [
  ['container', 'Container Ship'],
  ['lng', 'LNG Carrier'],
  ['gas', 'LNG Carrier'],
  ['bulk', 'Bulk Carrier'],
  ['tanker', 'Oil Tanker'],
  ['crude', 'Oil Tanker'],
  ['ro-ro', 'Ro-Ro Vessel'],
  ['roro', 'Ro-Ro Vessel'],
  ['vehicles carrier', 'Ro-Ro Vessel'],
  ['general cargo', 'General Cargo'],
  ['cargo', 'General Cargo'],
];

function mapVesselType(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const lower = raw.toLowerCase();
  for (const [needle, label] of KNOWN_TYPES) {
    if (lower.includes(needle)) return label;
  }
  return undefined;
}

function normalize(v: Record<string, unknown> | null | undefined) {
  if (!v) return null;
  const vesselType = mapVesselType(v.vessel_type as string | undefined);
  return {
    vesselName: (v.name as string) || undefined,
    imoNumber: v.imo != null ? String(v.imo) : undefined,
    callSign: (v.call_sign as string) || undefined,
    flag: (v.country as string) || undefined,
    vesselType,
    vesselTypeRaw: (v.vessel_type as string) || undefined,
    grossTonnage: typeof v.gross_tonnage === 'number' ? v.gross_tonnage : undefined,
  };
}

async function callVesselApi(path: string): Promise<Record<string, unknown> | null> {
  const res = await fetch(`${VESSELAPI_BASE}${path}`, {
    headers: { Authorization: `Bearer ${VESSELAPI_KEY}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`VesselAPI ${res.status}: ${text || res.statusText}`);
  }
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('[vessel-lookup] missing env: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return json({ error: 'Server is missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }, 500);
  }

  // Require a signed-in caller (no anonymous use of the AIS quota), but any
  // authenticated user is fine — this endpoint is read-only public AIS data.
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Unauthorized' }, 401);
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const { data: userData, error: authErr } = await admin.auth.getUser(authHeader.replace('Bearer ', ''));
  if (authErr || !userData.user) return json({ error: 'Unauthorized' }, 401);

  if (!VESSELAPI_KEY) {
    console.error('[vessel-lookup] missing env: VESSELAPI_KEY');
    return json({ error: 'Vessel lookup is not configured (missing VESSELAPI_KEY secret).' }, 500);
  }

  let payload: { imo?: string; name?: string; callsign?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const imo = (payload.imo || '').replace(/\D/g, '');
  const name = (payload.name || '').trim();
  const callsign = (payload.callsign || '').trim();

  try {
    let result: Record<string, unknown> | null = null;

    if (imo.length === 7) {
      const body = await callVesselApi(`/vessel/${imo}?filter.idType=imo`);
      result = (body?.vessel as Record<string, unknown>) ?? null;
    } else if (callsign.length >= 2) {
      const body = await callVesselApi(`/search/vessels?filter.callsign=${encodeURIComponent(callsign)}&pagination.limit=1`);
      const list = (body?.vessels as unknown[]) ?? (body?.data as unknown[]) ?? [];
      result = (list[0] as Record<string, unknown>) ?? null;
    } else if (name.length >= 3) {
      const body = await callVesselApi(`/search/vessels?filter.name=${encodeURIComponent(name)}&pagination.limit=1`);
      const list = (body?.vessels as unknown[]) ?? (body?.data as unknown[]) ?? [];
      result = (list[0] as Record<string, unknown>) ?? null;
    } else {
      return json({ vessel: null });
    }

    return json({ vessel: normalize(result) });
  } catch (err) {
    console.error('[vessel-lookup] VesselAPI call failed:', err);
    return json({ error: 'Vessel lookup service is unavailable right now.' }, 502);
  }
});
