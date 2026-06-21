import { init } from '@rafaelfrancisco-dev/ipma-weather-js'
import type { IPMAWeatherClient } from '#shared/ipma-types'
import type { H3Event } from 'h3'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

// Loaded once per warm instance, straight from the package's own wasm
// binary in node_modules — no public static asset, no per-request fetch.
let clientPromise: Promise<IPMAWeatherClient> | null = null

async function loadClient(): Promise<IPMAWeatherClient> {
  const wasmUrl = import.meta.resolve('@rafaelfrancisco-dev/ipma-weather-js/wasm')
  const wasmBytes = await readFile(fileURLToPath(wasmUrl))
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

export const cachedWarnings = defineCachedFunction(
  async (_event: H3Event) => (await getIpmaClient()).weatherWarnings(),
  { name: 'ipma', getKey: () => 'warnings', maxAge: 600 }
)

export const cachedObservations = defineCachedFunction(
  async (_event: H3Event) => (await getIpmaClient()).latestStationObservations(),
  { name: 'ipma', getKey: () => 'observations', maxAge: 3600 }
)

export const cachedForecast = defineCachedFunction(
  async (_event: H3Event, locationId: number) => (await getIpmaClient()).aggregateForecast(locationId),
  { name: 'ipma', getKey: (_event: H3Event, locationId: number) => `forecast:${locationId}`, maxAge: 3600 }
)
