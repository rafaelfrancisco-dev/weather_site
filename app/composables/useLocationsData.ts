import type {
  JSLocation,
  JSDistrict,
  JSWeatherWarning,
  JSLookupDescription,
  JSStationObservationFeature
} from '~/utils/ipma-types'
import { createLabelLookup } from '~/utils/transform'

const locations = ref<JSLocation[]>([])
const districts = ref<JSDistrict[]>([])
const warnings = ref<JSWeatherWarning[]>([])
const weatherTypeDescriptions = ref<JSLookupDescription[]>([])
const observations = ref<JSStationObservationFeature[]>([])
const bootstrapped = ref(false)
const bootstrapError = ref<string | null>(null)
let started = false

export function useLocationsData() {
  const { client, ready } = useIpmaClient()

  async function bootstrap() {
    if (!client.value) return
    try {
      const [locs, dists, warns, descs, obs] = await Promise.all([
        client.value.forecastLocations(),
        client.value.districts(),
        client.value.weatherWarnings(),
        client.value.weatherTypeDescriptions(),
        client.value.latestStationObservations()
      ])
      locations.value = locs
      districts.value = dists
      warnings.value = warns
      weatherTypeDescriptions.value = descs
      observations.value = obs
      bootstrapped.value = true
    } catch (e) {
      bootstrapError.value = e instanceof Error ? e.message : String(e)
    }
  }

  if (!started) {
    started = true
    watch(ready, (isReady) => { if (isReady) bootstrap() }, { immediate: true })
  }

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
    observations,
    bootstrapped,
    bootstrapError,
    districtMap,
    warningsByArea,
    labelFor
  }
}
