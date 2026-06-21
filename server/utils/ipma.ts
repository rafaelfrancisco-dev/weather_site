import { init } from 'ipma-weather-js'
import type { IPMAWeatherClient } from '#shared/ipma-types'
import type { H3Event } from 'h3'

// The wasm module is too large to bundle (base64-inlining 46MB blows up the
// build). It stays a plain public static asset and we fetch it ourselves,
// server-side, the same way the browser used to — just once per warm
// instance, never by visitors.
let clientPromise: Promise<IPMAWeatherClient> | null = null

function loadClient(event: H3Event): Promise<IPMAWeatherClient> {
  const config = useRuntimeConfig()
  const wasmPath = `${config.app.baseURL}ipma-weather-js.opt.wasm`.replace(/\/+/g, '/')
  const wasmUrl = new URL(wasmPath, getRequestURL(event)).toString()
  return init({ module: fetch(wasmUrl), getImports: () => ({}) })
    .then(({ exports }) => new exports.IPMAWeatherClient())
}

function getIpmaClient(event: H3Event): Promise<IPMAWeatherClient> {
  if (!clientPromise) clientPromise = loadClient(event)
  return clientPromise
}

export const cachedLocations = defineCachedFunction(
  async (event: H3Event) => (await getIpmaClient(event)).forecastLocations(),
  { name: 'ipma', getKey: () => 'locations', maxAge: 86400 }
)

export const cachedDistricts = defineCachedFunction(
  async (event: H3Event) => (await getIpmaClient(event)).districts(),
  { name: 'ipma', getKey: () => 'districts', maxAge: 86400 }
)

export const cachedWeatherTypes = defineCachedFunction(
  async (event: H3Event) => (await getIpmaClient(event)).weatherTypeDescriptions(),
  { name: 'ipma', getKey: () => 'weather-types', maxAge: 86400 }
)

export const cachedWarnings = defineCachedFunction(
  async (event: H3Event) => (await getIpmaClient(event)).weatherWarnings(),
  { name: 'ipma', getKey: () => 'warnings', maxAge: 600 }
)

export const cachedObservations = defineCachedFunction(
  async (event: H3Event) => (await getIpmaClient(event)).latestStationObservations(),
  { name: 'ipma', getKey: () => 'observations', maxAge: 3600 }
)

export const cachedForecast = defineCachedFunction(
  async (event: H3Event, locationId: number) => (await getIpmaClient(event)).aggregateForecast(locationId),
  { name: 'ipma', getKey: (_event: H3Event, locationId: number) => `forecast:${locationId}`, maxAge: 3600 }
)
