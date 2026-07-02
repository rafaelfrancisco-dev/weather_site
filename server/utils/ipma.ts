import { init } from '@rafaelfrancisco-dev/ipma-weather-js'
import type { IPMAWeatherClient } from '#shared/ipma-types'
import type { H3Event } from 'h3'

// Loaded once per warm instance, from the wasm binary Nitro bundles as a
// server asset (see nuxt.config.ts) — import.meta.resolve/url get rewritten
// inside Nitro's bundled chunks, so they can't be used to find it at runtime.
let clientPromise: Promise<IPMAWeatherClient> | null = null

async function loadClient(): Promise<IPMAWeatherClient> {
  const wasmBytes = await useStorage('assets:ipma').getItemRaw('ipma-weather-js.wasm')
  const module = await WebAssembly.compile(wasmBytes)
  const { exports } = await init({ module, getImports: () => ({}) })
  return new exports.IPMAWeatherClient()
}

function getIpmaClient(): Promise<IPMAWeatherClient> {
  if (!clientPromise) clientPromise = loadClient()
  return clientPromise
}

export const cachedLocations = defineCachedFunction(
  async (_event: H3Event) => (await getIpmaClient()).forecastLocations(),
  { name: 'ipma', getKey: () => 'locations', maxAge: 86400 }
)

export const cachedDistricts = defineCachedFunction(
  async (_event: H3Event) => (await getIpmaClient()).districts(),
  { name: 'ipma', getKey: () => 'districts', maxAge: 86400 }
)

export const cachedWeatherTypes = defineCachedFunction(
  async (_event: H3Event) => (await getIpmaClient()).weatherTypeDescriptions(),
  { name: 'ipma', getKey: () => 'weather-types', maxAge: 86400 }
)

// maxAge matches cachedForecast/cachedObservations (3600) rather than a
// tighter window: /location/** and /maps/** SSR-render warnings data and
// use this same 3600 figure for their `isr` route rules (nuxt.config.ts),
// so warnings freshness is intentionally capped at 1h to keep those pages'
// ISR regeneration frequency (and Vercel ISR write volume) down. Don't
// shorten this without also reconsidering those isr windows.
export const cachedWarnings = defineCachedFunction(
  async (_event: H3Event) => (await getIpmaClient()).weatherWarnings(),
  { name: 'ipma', getKey: () => 'warnings', maxAge: 3600 }
)

export const cachedStations = defineCachedFunction(
  async (_event: H3Event) => (await getIpmaClient()).stations(),
  { name: 'ipma', getKey: () => 'stations', maxAge: 86400 }
)

export const cachedObservations = defineCachedFunction(
  async (_event: H3Event) => (await getIpmaClient()).stationObservations(),
  { name: 'ipma', getKey: () => 'observations', maxAge: 3600 }
)

export const cachedForecast = defineCachedFunction(
  async (_event: H3Event, locationId: number) => (await getIpmaClient()).aggregateForecast(locationId),
  { name: 'ipma', getKey: (_event: H3Event, locationId: number) => `forecast:${locationId}`, maxAge: 3600 }
)
