import * as Sentry from '@sentry/nuxt'
import { CAPITALS } from '~/utils/maps'
import type { FcPoint } from '#shared/map-types'

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export default defineCachedEventHandler(
  async (event) => {
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
  },
  { name: 'ipma', getKey: () => 'map-forecast', maxAge: 3600 }
)
