import * as Sentry from '@sentry/nuxt'
import type { MapForecastBatchEntry } from '#shared/map-types'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const idsParam = typeof query.ids === 'string' ? query.ids : ''
  // Only ids from the known location list may reach cachedForecast — every
  // unknown id would otherwise mint its own Redis entry.
  const known = new Set((await cachedLocations(event)).map(l => l.id))
  const ids = [...new Set(
    idsParam.split(',').map(s => Number(s.trim())).filter(n => Number.isInteger(n) && known.has(n))
  )].slice(0, 80)

  const results = await Promise.all(
    ids.map(async (id) => {
      try {
        const fc = await cachedForecast(event, id)
        const today = (fc as unknown as { daily: { tMax: number; tMin: number; weatherTypeID: number; forecastDate: string }[] }).daily?.[0]
        return { id: String(id), tmax: today?.tMax ?? null, tmin: today?.tMin ?? null, wt: today?.weatherTypeID ?? null }
      } catch (error) {
        Sentry.captureException(error)
        return { id: String(id), tmax: null, tmin: null, wt: null }
      }
    })
  )

  return results as MapForecastBatchEntry[]
})
