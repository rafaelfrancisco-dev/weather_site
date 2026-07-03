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
  stations: JSStation[]
  observations: JSStationObservation[]
}

// Matches cachedObservations' maxAge (server/utils/ipma.ts) — the tightest
// freshness window among the bootstrapped data — so a tab left open on a
// location page doesn't drift past what the server itself would consider stale.
const REVALIDATE_AFTER_MS = 10 * 60 * 1000
let revalidationWired = false

export function useLocationsData() {
  const requestFetch = useRequestFetch()
  const { data, error, refresh } = useAsyncData<Bootstrap>('ipma-bootstrap', async () => {
    const [locations, districts, warnings, weatherTypeDescriptions, observations] = await Promise.all([
      requestFetch<JSLocation[]>('/api/locations'),
      requestFetch<JSDistrict[]>('/api/districts'),
      requestFetch<JSWeatherWarning[]>('/api/warnings'),
      requestFetch<JSLookupDescription[]>('/api/weather-types'),
      requestFetch<ObservationsPayload>('/api/observations')
    ])
    return { locations, districts, warnings, weatherTypeDescriptions, stations: observations.stations, observations: observations.observations }
  })

  // useLocationsData() is called from several components/pages sharing the
  // same 'ipma-bootstrap' asyncData key; wire the revalidation listener once
  // per browser session (module-level guard) rather than once per caller.
  // Best-effort: refresh() errors are swallowed rather than surfaced, since
  // the app should keep showing the last-known-good data (see the
  // bootstrapError/!bootstrapped guard in layouts/default.vue) instead of
  // blanking out or logging noise for a transient background refetch.
  if (import.meta.client && !revalidationWired) {
    revalidationWired = true
    let lastFetchedAt = Date.now()
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return
      if (Date.now() - lastFetchedAt < REVALIDATE_AFTER_MS) return
      lastFetchedAt = Date.now()
      refresh().catch(() => {})
    })
  }

  const locations = computed(() => data.value?.locations ?? [])
  const districts = computed(() => data.value?.districts ?? [])
  const warnings = computed(() => data.value?.warnings ?? [])
  const weatherTypeDescriptions = computed(() => data.value?.weatherTypeDescriptions ?? [])
  const stations = computed(() => data.value?.stations ?? [])
  const observations = computed(() => data.value?.observations ?? [])
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
    bootstrapped,
    bootstrapError,
    districtMap,
    warningsByArea,
    labelFor
  }
}
