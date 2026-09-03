// Thin client wrapper around the `vessel-lookup` Edge Function. Used to
// auto-fill the "Create Vessel Record" form from live AIS data (VesselAPI)
// once the user types an IMO number, vessel name, or call sign. The browser
// never holds the VesselAPI key — it invokes the function, which holds it.

import { supabase } from '@/lib/supabase/client';

export interface VesselLookupResult {
  vesselName?: string;
  imoNumber?: string;
  callSign?: string;
  flag?: string;
  vesselType?: string;
  vesselTypeRaw?: string;
  grossTonnage?: number;
  // Crew-reported over AIS, not OnePort data — can be stale by days. No ETD
  // equivalent exists (a ship can't broadcast a departure time for a port
  // it hasn't reached yet).
  eta?: string;
  destinationPort?: string;
}

export interface VesselLookupParams {
  imo?: string;
  name?: string;
  callsign?: string;
}

// Non-blocking by design: this is a convenience auto-fill, not a required
// step, so any failure (function not deployed yet, no VESSELAPI_KEY secret
// set, no match found, network hiccup) resolves to `null` rather than
// throwing — the form stays fully usable for manual entry either way.
export async function lookupVessel(params: VesselLookupParams): Promise<VesselLookupResult | null> {
  try {
    const { data, error } = await supabase.functions.invoke('vessel-lookup', { body: params });
    if (error) {
      console.warn('[vessel-lookup] request failed:', error);
      return null;
    }
    const body = data as { vessel?: VesselLookupResult | null; error?: string } | null;
    if (body?.error) {
      console.warn('[vessel-lookup]', body.error);
      return null;
    }
    return body?.vessel ?? null;
  } catch (err) {
    console.warn('[vessel-lookup] unexpected error:', err);
    return null;
  }
}
