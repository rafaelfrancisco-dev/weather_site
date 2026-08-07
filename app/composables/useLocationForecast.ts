import * as Sentry from '@sentry/nuxt'
import type { Lang } from '~/utils/i18n'
import { wallClockMs, weatherIconUrl } from '~/utils/format'
import { accentColors } from '~/utils/colors'
import type { JSAggregateForecastDay, JSHourlyForecastPeriod } from '#shared/ipma-types'
import {
  buildLocationMeta,
  buildWarningBanner,
  buildDailyRows,
  buildHourlyGrid,
  buildObservationGrid
} from '~/utils/transform'
import { buildDailyRangeModel, buildMeteogramModel } from '~/utils/charts'

interface ForecastResult {
  dataUpdate: string
  daily: JSAggregateForecastDay[]
  periods: JSHourlyForecastPeriod[]
}

interface CachedForecast {
  forecast: ForecastResult
  fetchedAt: number
}

interface ForecastPayload {
  locationId: number | null
  forecast: ForecastResult | null
}

// Matches cachedForecast's maxAge (server/utils/ipma.ts) and mirrors
// REVALIDATE_BOOTSTRAP_AFTER_MS in useLocationsData.ts — a cache entry older
// than what the server itself would consider stale gets refetched in the
// background. Accepted limitation: /api/forecast/** sits behind its own 3600s
// ISR rule, so the first revalidation after a long idle can still return an
// up-to-~1h-stale response while Vercel regenerates it — bounded and
// self-healing, versus a client cache that never expired at all.
const REVALIDATE_FORECAST_AFTER_MS = 60 * 60 * 1000

// Hover prefetches are shared with the navigation fetch so a click that lands
// while the prefetch is still in flight adopts that request instead of issuing
// a duplicate one (it used to fire a second identical request and wait on the
// slower of the two). Module-level rather than useState because both entry
// points are client-only — the same guard pattern as useLocationsData.ts's
// `revalidationWired` and useNow.ts's `nowListenersWired` — and because a
// Promise must not end up in payload-serialized, deep-reactive state.
//
// Only prefetch writes here: its requests carry no AbortSignal, so an adopting
// navigation can never abort a request another caller is also waiting on.
const inflightPrefetches = new Map<number, Promise<ForecastResult>>()

// The cache is keyed by location id and would otherwise grow without bound —
// hovering across the ~300-location sidebar can accumulate every one of them.
// Evicts oldest-first by fetchedAt; the entry just written is always newest, so
// the displayed location is never the one evicted (and forecastPayload holds
// the rendered forecast independently of the cache regardless).
const FORECAST_CACHE_LIMIT = 30

function writeForecastCache(cache: Record<string, CachedForecast>, key: string, entry: CachedForecast) {
  cache[key] = entry
  const keys = Object.keys(cache)
  if (keys.length <= FORECAST_CACHE_LIMIT) return
  keys.sort((a, b) => (cache[a]?.fetchedAt ?? 0) - (cache[b]?.fetchedAt ?? 0))
  for (const stale of keys.slice(0, keys.length - FORECAST_CACHE_LIMIT)) delete cache[stale]
}

export function useLocationForecast(id: Ref<number | null>, lang: Ref<Lang>, t: Ref<Record<string, string>>) {
  const { locations, districtMap, warningsByArea, stations, observations, labelFor } = useLocationsData()
  const settings = useSettings()
  const now = useNow()
  const requestFetch = useRequestFetch()
  const forecastCache = useState<Record<string, CachedForecast>>('ipma-forecast-client-cache', () => ({}))

  const selectedLocation = computed(() => locations.value.find(l => l.id === id.value) ?? null)
  const selectedLocationId = computed(() => selectedLocation.value?.id ?? null)
  const forecastKey = computed(() => `ipma-forecast-${selectedLocationId.value ?? 'none'}`)

  const forecastPayload = shallowRef<ForecastPayload>({ locationId: null, forecast: null })
  const forecastLoading = ref(false)
  const forecastErrorRaw = shallowRef<unknown>(null)
  // Assigned by the client-only block below; stays null during SSR, where
  // there is nothing to retry.
  let runFetch: ((locationId: number, key: string, background: boolean) => void) | null = null

  // The initial location's forecast is fetched during SSR (lazy async data is
  // still awaited via onServerPrefetch on the server) so the first HTML — the
  // one ISR caches and crawlers index — contains the forecast. Client-side
  // navigations never run this fetch; they use the watch-based cache below.
  const initialId = selectedLocationId.value
  const { data: ssrForecast } = useAsyncData<ForecastResult | null>(
    `ipma-forecast-ssr-${initialId ?? 'none'}`,
    () => initialId == null
      ? Promise.resolve(null)
      : requestFetch<ForecastResult>(`/api/forecast/${initialId}`),
    { lazy: true, immediate: import.meta.server && initialId != null, default: () => null }
  )

  if (import.meta.client) {
    // Seed the client cache with the server-rendered forecast before the watch
    // below runs, so hydration reuses it instead of re-fetching. fetchedAt is
    // the server render clock — useNow()'s value at setup time is still the
    // serialized payload timestamp (the bump to real time happens later, in
    // onNuxtReady) — so a stale ISR page seeds an already-old entry, which the
    // now-watcher below revalidates as soon as the clock bumps.
    if (initialId != null && ssrForecast.value) {
      writeForecastCache(forecastCache.value, `ipma-forecast-${initialId}`, { forecast: ssrForecast.value, fetchedAt: now.value })
    }

    let requestId = 0
    let controller: AbortController | null = null

    // background: stale data is already on screen, so don't touch
    // forecastLoading (no skeleton flash) and report failures to Sentry
    // instead of surfacing them — the stale forecast stays up.
    async function fetchForecast(locationId: number, key: string, background: boolean) {
      requestId += 1
      const currentRequestId = requestId
      controller?.abort()
      controller = new AbortController()
      if (!background) forecastLoading.value = true

      try {
        // Adopt an in-flight hover prefetch for this location rather than
        // racing it. The adopted request carries no signal, so navigating away
        // can't abort it — the requestId/selection guard below discards the
        // result instead, and it still lands in the prefetch's own cache write.
        const inflight = inflightPrefetches.get(locationId)
        const forecast = inflight
          ? await inflight
          : await requestFetch<ForecastResult>(`/api/forecast/${locationId}`, { signal: controller.signal })
        if (currentRequestId !== requestId || selectedLocationId.value !== locationId) return
        writeForecastCache(forecastCache.value, key, { forecast, fetchedAt: Date.now() })
        forecastPayload.value = { locationId, forecast }
      } catch (error) {
        if ((error as { name?: string }).name === 'AbortError') return
        if (background) {
          Sentry.captureException(error)
        } else if (currentRequestId === requestId && selectedLocationId.value === locationId) {
          forecastErrorRaw.value = error
        }
      } finally {
        if (!background && currentRequestId === requestId) {
          forecastLoading.value = false
        }
      }
    }

    watch(selectedLocationId, (locationId) => {
      requestId += 1
      controller?.abort()
      controller = null
      forecastErrorRaw.value = null

      if (locationId == null) {
        forecastPayload.value = { locationId: null, forecast: null }
        forecastLoading.value = false
        return
      }

      const key = forecastKey.value
      const cached = forecastCache.value[key]
      forecastPayload.value = { locationId, forecast: cached?.forecast ?? null }

      if (cached) {
        forecastLoading.value = false
        // Stale-while-revalidate: the cached forecast paints immediately, but
        // an entry past the freshness window kicks off a background refetch
        // that replaces it on success.
        if (now.value - cached.fetchedAt >= REVALIDATE_FORECAST_AFTER_MS) {
          void fetchForecast(locationId, key, true)
        }
        return
      }

      void fetchForecast(locationId, key, false)
    }, { immediate: true, flush: 'sync' })

    // Revalidate when the frozen clock bumps (post-hydration via onNuxtReady,
    // and on every visibilitychange → visible): one watcher covers both a
    // stale ISR payload seeded above and a tab left open past the window.
    watch(now, (nowMs) => {
      const locationId = selectedLocationId.value
      if (locationId == null || forecastLoading.value) return
      const key = forecastKey.value
      const cached = forecastCache.value[key]
      if (cached && nowMs - cached.fetchedAt < REVALIDATE_FORECAST_AFTER_MS) return
      void fetchForecast(locationId, key, cached != null)
    })

    runFetch = (locationId, key, background) => { void fetchForecast(locationId, key, background) }

    onBeforeUnmount(() => {
      controller?.abort()
    })
  }

  // Foreground retry for the error state in pages/location/[slug].vue — clears
  // the error so the skeletons come back, then refetches.
  function retryForecast() {
    const locationId = selectedLocationId.value
    if (locationId == null || !runFetch) return
    forecastErrorRaw.value = null
    runFetch(locationId, forecastKey.value, false)
  }

  const forecast = computed(() => {
    if (forecastPayload.value.locationId === selectedLocationId.value && forecastPayload.value.forecast) {
      return forecastPayload.value.forecast
    }
    // SSR render path: the client-only watch never ran, read the async data.
    if (initialId != null && selectedLocationId.value === initialId) {
      return ssrForecast.value
    }
    return null
  })

  const forecastError = computed(() => forecastErrorRaw.value
    ? ((forecastErrorRaw.value as { message?: string }).message ?? String(forecastErrorRaw.value))
    : null
  )

  const c = computed(() => accentColors(settings.value.accent))

  const locationMeta = computed(() => {
    if (!selectedLocation.value) return null
    const district = districtMap.value.get(selectedLocation.value.districtID)
    return buildLocationMeta(selectedLocation.value, district, forecast.value?.dataUpdate ?? null, lang.value)
  })

  const locationWarnings = computed(() => {
    if (!selectedLocation.value) return []
    return warningsByArea.value.get(selectedLocation.value.warningAreaID) ?? []
  })

  const warningBanner = computed(() => buildWarningBanner(locationWarnings.value, lang.value, t.value.warnings, now.value))

  const dailyRows = computed(() => forecast.value
    ? buildDailyRows(forecast.value.daily, lang.value, labelFor.value, weatherIconUrl)
    : []
  )

  // IPMA's hourly forecastDate is Lisbon-anchored for every location regardless
  // of actual region (verified: Azores locations return the same timestamps as
  // mainland ones), so the wall-clock zone here is always Europe/Lisbon, not
  // per-location.
  const hourlyGrid = computed(() => forecast.value
    ? buildHourlyGrid(forecast.value.periods, lang.value, t.value, labelFor.value, weatherIconUrl, c.value.primary, settings.value.hourlyBars, wallClockMs(now.value, 'Europe/Lisbon'))
    : { dayHeaders: [], timeCols: [], hourRows: [], hourDays: [] }
  )

  // Chart models depend on lang so labels rebuild on language change —
  // vue-chartjs then updates the charts in place.
  const meteogramModel = computed(() => forecast.value
    ? buildMeteogramModel(forecast.value.periods, lang.value, wallClockMs(now.value, 'Europe/Lisbon'))
    : null
  )

  const dailyRangeModel = computed(() => forecast.value
    ? buildDailyRangeModel(forecast.value.daily, lang.value)
    : null
  )

  const observationGrid = computed(() => selectedLocation.value
    ? buildObservationGrid(stations.value, observations.value, selectedLocation.value.latitude, selectedLocation.value.longitude, lang.value, t.value, c.value.primary, c.value.soft)
    : buildObservationGrid([], [], 0, 0, lang.value, t.value, c.value.primary, c.value.soft)
  )

  return {
    forecast,
    forecastLoading,
    forecastError,
    retryForecast,
    selectedLocation,
    locationMeta,
    warningBanner,
    dailyRows,
    hourlyGrid,
    meteogramModel,
    dailyRangeModel,
    observationGrid,
    c
  }
}

// Lets the sidebar start fetching a location's forecast on hover/touch, ahead
// of the click that actually navigates there — so by the time the watch in
// useLocationForecast fires, the result is often already cached or in flight.
// Best-effort only: errors are swallowed since the real fetch on navigation
// will retry and surface them properly.
export function usePrefetchForecast() {
  const requestFetch = useRequestFetch()
  const forecastCache = useState<Record<string, CachedForecast>>('ipma-forecast-client-cache', () => ({}))

  function prefetch(locationId: number) {
    const key = `ipma-forecast-${locationId}`
    const cached = forecastCache.value[key]
    if (cached && Date.now() - cached.fetchedAt < REVALIDATE_FORECAST_AFTER_MS) return
    if (inflightPrefetches.has(locationId)) return

    // Deliberately no AbortSignal: useLocationForecast's navigation fetch may
    // adopt this promise, and aborting a request another caller awaits would
    // surface as a spurious error there.
    const request = requestFetch<ForecastResult>(`/api/forecast/${locationId}`)
    inflightPrefetches.set(locationId, request)

    request
      .then((forecast) => { writeForecastCache(forecastCache.value, key, { forecast, fetchedAt: Date.now() }) })
      .catch((error) => { Sentry.captureException(error) })
      .finally(() => {
        if (inflightPrefetches.get(locationId) === request) inflightPrefetches.delete(locationId)
      })
  }

  return { prefetch }
}
