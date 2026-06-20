import type { Lang } from '~/utils/i18n'
import { strings } from '~/utils/i18n'
import { accentColors } from '~/utils/colors'
import { weatherIconUrl } from '~/utils/format'
import type {
  JSLocation,
  JSDistrict,
  JSWeatherWarning,
  JSLookupDescription,
  JSAggregateForecastDay,
  JSHourlyForecastPeriod,
  JSStationObservationFeature
} from '~/utils/ipma-types'
import {
  buildRegionTree,
  buildLocationMeta,
  buildWarningBanner,
  buildDailyRows,
  buildHourlyGrid,
  nearestObservations,
  buildObservationRows,
  buildObservationCards,
  createLabelLookup
} from '~/utils/transform'

export interface WeatherDataOptions {
  lang: Ref<Lang>
  selectedId: Ref<number | null>
  query: Ref<string>
  openMap: Ref<Record<number, boolean>>
}

interface ForecastResult {
  dataUpdate: string
  daily: JSAggregateForecastDay[]
  periods: JSHourlyForecastPeriod[]
}

export function useWeatherData(options: WeatherDataOptions) {
  const { client, ready, error: clientError } = useIpmaClient()
  const settings = useSettings()

  const locations = ref<JSLocation[]>([])
  const districts = ref<JSDistrict[]>([])
  const warnings = ref<JSWeatherWarning[]>([])
  const weatherTypeDescriptions = ref<JSLookupDescription[]>([])
  const observations = ref<JSStationObservationFeature[]>([])
  const bootstrapped = ref(false)
  const bootstrapError = ref<string | null>(null)

  const forecastCache = new Map<number, ForecastResult>()
  const forecast = ref<ForecastResult | null>(null)
  const forecastLoading = ref(false)
  const forecastError = ref<string | null>(null)

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

      if (options.selectedId.value == null && locs.length > 0) {
        const lisboa = locs.find(l => l.name === 'Lisboa')
        options.selectedId.value = (lisboa ?? locs[0]).id
      }
    } catch (e) {
      bootstrapError.value = e instanceof Error ? e.message : String(e)
    }
  }

  async function loadForecast(id: number) {
    if (!client.value) return
    const cached = forecastCache.get(id)
    if (cached) {
      forecast.value = cached
      return
    }
    forecastLoading.value = true
    forecastError.value = null
    try {
      const result = await client.value.aggregateForecast(id)
      forecastCache.set(id, result)
      forecast.value = result
    } catch (e) {
      forecastError.value = e instanceof Error ? e.message : String(e)
    } finally {
      forecastLoading.value = false
    }
  }

  watch(ready, (isReady) => { if (isReady) bootstrap() }, { immediate: true })
  watch(options.selectedId, (id) => { if (id != null) loadForecast(id) }, { immediate: true })

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
  const iconUrl = weatherIconUrl

  const selectedLocation = computed(() => locations.value.find(l => l.id === options.selectedId.value) ?? null)

  const t = computed(() => strings(options.lang.value))
  const c = computed(() => accentColors(settings.value.accent))

  const tree = computed(() => buildRegionTree(
    locations.value,
    warningsByArea.value,
    options.selectedId.value,
    options.openMap.value,
    options.query.value,
    options.lang.value
  ))

  const locationMeta = computed(() => {
    if (!selectedLocation.value) return null
    const district = districtMap.value.get(selectedLocation.value.districtID)
    return buildLocationMeta(selectedLocation.value, district, forecast.value?.dataUpdate ?? null, options.lang.value)
  })

  const locationWarnings = computed(() => {
    if (!selectedLocation.value) return []
    return warningsByArea.value.get(selectedLocation.value.warningAreaID) ?? []
  })

  const warningBanner = computed(() => buildWarningBanner(locationWarnings.value, options.lang.value, t.value.warnings))

  const dailyRows = computed(() => forecast.value
    ? buildDailyRows(forecast.value.daily, options.lang.value, labelFor.value, iconUrl)
    : []
  )

  const hourlyGrid = computed(() => forecast.value
    ? buildHourlyGrid(forecast.value.periods, options.lang.value, t.value, labelFor.value, iconUrl, c.value.primary, settings.value.hourlyBars)
    : { dayHeaders: [], timeCols: [], hourRows: [], hourDays: [] }
  )

  const nearestObs = computed(() => selectedLocation.value
    ? nearestObservations(observations.value, selectedLocation.value.latitude, selectedLocation.value.longitude, 5)
    : []
  )

  const obsRows = computed(() => buildObservationRows(nearestObs.value))
  const obsCards = computed(() => buildObservationCards(nearestObs.value, t.value))

  return {
    ready,
    clientError,
    bootstrapped,
    bootstrapError,
    forecastLoading,
    forecastError,
    tree,
    selectedLocation,
    locationMeta,
    warningBanner,
    dailyRows,
    hourlyGrid,
    obsRows,
    obsCards,
    t,
    c
  }
}
