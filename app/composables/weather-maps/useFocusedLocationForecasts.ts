import * as Sentry from '@sentry/nuxt'
import type { FcPoint, MapFocus, MapForecastBatchEntry, WarnEntry } from '#shared/map-types'
import type { Lang } from '~/utils/i18n'
import { CAPITALS } from '~/utils/maps'
import { regionLabel } from '~/utils/transform'

interface LocFc { tmax: number | null; tmin: number | null; wt: number | null }

export function useFocusedLocationForecasts(
  focus: Ref<MapFocus | null>,
  lang: ComputedRef<Lang>,
  districtWarnings: ComputedRef<Record<string, WarnEntry>>,
  forecastData: ComputedRef<FcPoint[]>,
) {
  const { locations, districtMap } = useLocationsData()

  const capitalNames = computed(() => new Set(CAPITALS.map(c => c.name)))

  function isCapitalLoc(loc: { name: string }): boolean {
    return capitalNames.value.has(loc.name)
  }

  const focusedLocations = computed(() => {
    if (!focus.value) return []
    return locations.value
      .filter((loc) => {
        if (focus.value?.group === 'mainland') {
          const district = districtMap.value.get(loc.districtID)
          return district?.name === focus.value.district
        }
        return loc.regionID === (focus.value.group === 'madeira' ? 2 : 3)
      })
      .slice()
      .sort((a, b) => {
        const aC = capitalNames.value.has(a.name) ? 0 : 1
        const bC = capitalNames.value.has(b.name) ? 0 : 1
        if (aC !== bC) return aC - bC
        return a.name.localeCompare(b.name)
      })
  })

  const focusedDistrictWarning = computed(() =>
    focus.value?.district ? districtWarnings.value[focus.value.district] : null
  )

  function locationRegion(loc: { regionID: number; districtID: number }) {
    if (loc.regionID === 1) return districtMap.value.get(loc.districtID)?.name ?? regionLabel(loc.regionID, lang.value)
    return regionLabel(loc.regionID, lang.value)
  }

  const districtLocationForecasts = ref<Record<number, LocFc>>({})

  // Matches the server-side cap in server/api/map-forecast-batch.get.ts.
  const BATCH_LIMIT = 80

  // One batched request per (up to) 80 locations instead of one request per
  // location — a district like Lisboa used to fan out 15-20 parallel
  // /api/forecast/{id} calls for data this endpoint returns in a single round
  // trip. WeatherMap.vue already fetches the map's viewport the same way.
  watch(focusedLocations, async (locs) => {
    if (!import.meta.client || !locs.length) return
    const toFetch = locs.filter(loc => !(loc.id in districtLocationForecasts.value))
    if (!toFetch.length) return

    for (let i = 0; i < toFetch.length; i += BATCH_LIMIT) {
      const chunk = toFetch.slice(i, i + BATCH_LIMIT)
      try {
        const batch = await $fetch<MapForecastBatchEntry[]>('/api/map-forecast-batch', {
          query: { ids: chunk.map(loc => loc.id).join(',') },
        })
        for (const entry of batch) {
          districtLocationForecasts.value[Number(entry.id)] = { tmax: entry.tmax, tmin: entry.tmin, wt: entry.wt }
        }
        // Ids the endpoint dropped (unknown upstream) still need an entry, or
        // the watch would refetch them on every focus change.
        const returned = new Set(batch.map(entry => Number(entry.id)))
        for (const loc of chunk) {
          if (!returned.has(loc.id)) districtLocationForecasts.value[loc.id] = { tmax: null, tmin: null, wt: null }
        }
      } catch (error) {
        // Best-effort: leave the rows blank rather than failing the map.
        Sentry.captureException(error)
        for (const loc of chunk) districtLocationForecasts.value[loc.id] = { tmax: null, tmin: null, wt: null }
      }
    }
    // `immediate` is required, not cosmetic: on a *hard load* of /maps/:district
    // the route watcher in useDistrictFocus runs with `immediate: true`, so
    // `focus` is already set — and `locations` already hydrated from the
    // payload — by the time this watcher registers. focusedLocations therefore
    // never *changes* afterwards, and a non-immediate watcher would never fire,
    // leaving every non-capital row in the district list blank (only capitals
    // have data, via /api/map-forecast). Client-side navigation into a district
    // does change it, which is why that path worked. The callback is safe to
    // run eagerly: it no-ops during SSR and on an empty list.
  }, { immediate: true })

  function locationForecast(loc: { id: number; name: string }) {
    return forecastData.value.find(point => point.id === String(loc.id) || point.name === loc.name)
  }

  function locationData(loc: { id: number; name: string }): LocFc | null {
    if (loc.id in districtLocationForecasts.value) return districtLocationForecasts.value[loc.id]
    const fc = locationForecast(loc)
    if (!fc) return null
    return { tmax: fc.tmax, tmin: fc.tmin, wt: fc.wt }
  }

  return {
    focusedLocations,
    focusedDistrictWarning,
    isCapitalLoc,
    locationRegion,
    locationData,
  }
}
