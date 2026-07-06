import * as Sentry from '@sentry/nuxt'
import type {
  JSLocation,
  JSDistrict,
  JSWeatherWarning,
  JSLookupDescription,
  JSStation,
  JSStationObservation
} from '#shared/ipma-types'
import { createLabelLookup } from '~/utils/transform'

interface ObservationsPayload {
  stations: JSStation[]
  observations: JSStationObservation[]
}

interface Bootstrap {
  locations: JSLocation[]
  districts: JSDistrict[]
  warnings: JSWeatherWarning[]
  weatherTypeDescriptions: JSLookupDescription[]
}

// Matches cachedWarnings' maxAge (server/utils/ipma.ts) — the freshness cap
// for the rest of the bootstrap (locations/districts/warnings/weather-types)
// — so a tab left open doesn't drift past what the server itself would
// consider stale.
const REVALIDATE_BOOTSTRAP_AFTER_MS = 60 * 60 * 1000
// Matches cachedObservations' maxAge (server/utils/ipma.ts) — observations
// are the most time-sensitive data on the site, so they get a tighter window.
const REVALIDATE_OBSERVATIONS_AFTER_MS = 10 * 60 * 1000
let revalidationWired = false

export function useLocationsData() {
  const requestFetch = useRequestFetch()
  const { data, error, refresh } = useAsyncData<Bootstrap>('ipma-bootstrap', async () => {
    const [locations, districts, warnings, weatherTypeDescriptions] = await Promise.all([
      requestFetch<JSLocation[]>('/api/locations'),
      requestFetch<JSDistrict[]>('/api/districts'),
      requestFetch<JSWeatherWarning[]>('/api/warnings'),
      requestFetch<JSLookupDescription[]>('/api/weather-types')
    ])
    return { locations, districts, warnings, weatherTypeDescriptions }
  })

  const { data: observationsData, status: observationsStatus, refresh: refreshObservations } =
    useAsyncData<ObservationsPayload | null>('ipma-observations', () => requestFetch<ObservationsPayload>('/api/observations'), {
      server: false,
      lazy: true,
      default: () => null
    })

  // useLocationsData() is called from several components/pages sharing the
  // same asyncData keys; wire the revalidation listener once per browser
  // session (module-level guard) rather than once per caller. Best-effort:
  // refresh() errors are swallowed rather than surfaced, since the app
  // should keep showing the last-known-good data (see the
  // bootstrapError/!bootstrapped guard in layouts/default.vue) instead of
  // blanking out or logging noise for a transient background refetch.
  if (import.meta.client && !revalidationWired) {
    revalidationWired = true
    let lastBootstrapFetchedAt = Date.now()
    let lastObservationsFetchedAt = Date.now()
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return
      const now = Date.now()
      if (now - lastBootstrapFetchedAt >= REVALIDATE_BOOTSTRAP_AFTER_MS) {
        lastBootstrapFetchedAt = now
        refresh().catch((error) => { Sentry.captureException(error) })
      }
      if (now - lastObservationsFetchedAt >= REVALIDATE_OBSERVATIONS_AFTER_MS) {
        lastObservationsFetchedAt = now
        refreshObservations().catch((error) => { Sentry.captureException(error) })
      }
    })
  }

  const locations = computed(() => data.value?.locations ?? [])
  const districts = computed(() => data.value?.districts ?? [])
  const warnings = computed(() => data.value?.warnings ?? [])
  const weatherTypeDescriptions = computed(() => data.value?.weatherTypeDescriptions ?? [])
  const stations = computed(() => observationsData.value?.stations ?? [])
  const observations = computed(() => observationsData.value?.observations ?? [])
  const observationsLoading = computed(() => observationsStatus.value === 'pending')
  const bootstrapped = computed(() => data.value != null)
  const bootstrapError = computed(() => error.value ? (error.value.message ?? String(error.value)) : null)

  const districtMap = computed(() => new Map(districts.value.map(d => [d.id, d])))

  const warningsByArea = computed(() => {
    const map = new Map<string, JSWeatherWarning[]>()
    for (const w of warnings.value) {
      if (!map.has(w.warningAreaID)) map.set(w.warningAreaID, [])
      map.get(w.warningAreaID)!.push(w)
    }
    return map
  })

  const labelFor = computed(() => createLabelLookup(weatherTypeDescriptions.value))

  return {
    locations,
    districts,
    warnings,
    stations,
    observations,
    observationsLoading,
    bootstrapped,
    bootstrapError,
    refreshBootstrap: refresh,
    districtMap,
    warningsByArea,
    labelFor
  }
}
