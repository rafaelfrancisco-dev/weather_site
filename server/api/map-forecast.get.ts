import * as Sentry from '@sentry/nuxt'
import type { H3Event } from 'h3'
import { CAPITALS } from '~/utils/maps'
import type { FcPoint } from '#shared/map-types'

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

async function buildMapForecast(event: H3Event): Promise<FcPoint[]> {
  const locations = await cachedLocations(event)

  // Build name lookup: normalised name → location (prefer exact matches)
  const byNorm = new Map<string, typeof locations[0]>()
  for (const loc of locations) {
    byNorm.set(normalize(loc.name), loc)
  }

  const results = await Promise.all(
    CAPITALS.map(async (cap) => {
      const loc = byNorm.get(normalize(cap.name))
      if (!loc) {
        return { id: cap.id, name: cap.name, district: cap.district, group: cap.group, lat: cap.lat, lon: cap.lon, tmax: null, tmin: null, wt: null, uv: null }
      }
      try {
        const fc = await cachedForecast(event, loc.id)
        const today = (fc as unknown as { daily: { tMax: number; tMin: number; weatherTypeID: number; uvIndex: number | null; forecastDate: string }[] }).daily?.[0]
        return {
          id: String(loc.id),
          name: cap.name,
          district: cap.district,
          group: cap.group,
          lat: cap.lat,
          lon: cap.lon,
          tmax: today?.tMax ?? null,
          tmin: today?.tMin ?? null,
          wt: today?.weatherTypeID ?? null,
          uv: today?.uvIndex ?? null,
        }
      } catch (error) {
        Sentry.captureException(error)
        return { id: cap.id, name: cap.name, district: cap.district, group: cap.group, lat: cap.lat, lon: cap.lon, tmax: null, tmin: null, wt: null, uv: null }
      }
    })
  )

  return results satisfies FcPoint[]
}

// A plain handler wrapping a defineCachedFunction, rather than
// defineCachedEventHandler, so swr:false doesn't leak into the response's
// cache-control header (defineCachedEventHandler derives it from opts.swr,
// which would emit `max-age=3600` and make browsers cache the payload for 1h
// on top of ISR). Caching is left entirely to the `/api/map-forecast` isr
// route rule; see server/utils/ipma.ts for why swr is false here too.
const cachedMapForecast = defineCachedFunction(buildMapForecast, {
  name: 'ipma',
  getKey: () => 'map-forecast',
  maxAge: 3600,
  swr: false
})

export default defineEventHandler(event => cachedMapForecast(event))
