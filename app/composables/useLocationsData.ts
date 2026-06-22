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

export function useLocationsData() {
  const requestFetch = useRequestFetch()
  const { data, error } = useAsyncData<Bootstrap>('ipma-bootstrap', async () => {
    const [locations, districts, warnings, weatherTypeDescriptions, observations] = await Promise.all([
      requestFetch<JSLocation[]>('/api/locations'),
      requestFetch<JSDistrict[]>('/api/districts'),
      requestFetch<JSWeatherWarning[]>('/api/warnings'),
      requestFetch<JSLookupDescription[]>('/api/weather-types'),
      requestFetch<ObservationsPayload>('/api/observations')
    ])
    return { locations, districts, warnings, weatherTypeDescriptions, stations: observations.stations, observations: observations.observations }
  })

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
