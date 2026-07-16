// Maritime weather for the command centre.
//
// OnePort does not (yet) integrate a live meteorological feed, so this module
// derives stable, plausible port conditions deterministically from the port
// name + calendar day. The same port shows the same conditions for the whole
// day and shifts gradually over the week — enough to drive operational
// awareness (wind/sea-state gating cargo ops) without pretending to be a live
// NOAA/ECMWF feed. Swap `deriveWeather` for a real API call when available.

export type SeaState = 'Calm' | 'Slight' | 'Moderate' | 'Rough' | 'Very Rough';
export type WeatherSeverity = 'good' | 'watch' | 'alert';

export interface MaritimeWeather {
  port: string;
  windKts: number;
  windDir: string;
  visibilityKm: number;
  seaState: SeaState;
  swellM: number;
  rainChancePct: number;
  temperatureC: number;
  severity: WeatherSeverity;
  summary: string;
  advisory: string;
}

const DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const SEA_STATES: SeaState[] = ['Calm', 'Slight', 'Moderate', 'Rough', 'Very Rough'];

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededRange(seed: number, min: number, max: number): number {
  const x = Math.sin(seed) * 10000;
  const frac = x - Math.floor(x);
  return min + frac * (max - min);
}

export function deriveWeather(port: string, day: Date = new Date()): MaritimeWeather {
  const cleanPort = (port || 'At Sea').trim();
  const dayKey = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
  const seed = hashString(`${cleanPort}|${dayKey}`);

  const windKts = Math.round(seededRange(seed, 4, 32));
  const windDir = DIRS[seed % DIRS.length];
  const visibilityKm = Math.round(seededRange(seed + 1, 3, 12));
  const swellM = Math.round(seededRange(seed + 2, 0.2, 3.4) * 10) / 10;
  const rainChancePct = Math.round(seededRange(seed + 3, 0, 90) / 5) * 5;
  const temperatureC = Math.round(seededRange(seed + 4, 14, 34));

  let seaIdx = 0;
  if (swellM > 2.5) seaIdx = 4;
  else if (swellM > 1.8) seaIdx = 3;
  else if (swellM > 1.0) seaIdx = 2;
  else if (swellM > 0.5) seaIdx = 1;
  const seaState = SEA_STATES[seaIdx];

  let severity: WeatherSeverity = 'good';
  if (windKts >= 25 || swellM >= 2.5 || visibilityKm <= 4) severity = 'alert';
  else if (windKts >= 17 || swellM >= 1.5 || rainChancePct >= 60) severity = 'watch';

  const summary =
    severity === 'alert'
      ? 'Heavy weather — operations at risk'
      : severity === 'watch'
      ? 'Marginal conditions — monitor closely'
      : 'Fair conditions — operations nominal';

  const advisory =
    severity === 'alert'
      ? 'High wind / swell may suspend pilotage & cargo ops. Confirm with harbour master.'
      : severity === 'watch'
      ? 'Conditions may affect small-craft transfers and open-hatch cargo work.'
      : 'No weather constraints on berthing, pilotage or cargo operations.';

  return {
    port: cleanPort,
    windKts,
    windDir,
    visibilityKm,
    seaState,
    swellM,
    rainChancePct,
    temperatureC,
    severity,
    summary,
    advisory,
  };
}
