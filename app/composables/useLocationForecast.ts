import type { Lang } from '~/utils/i18n'
import { weatherIconUrl } from '~/utils/format'
import { accentColors } from '~/utils/colors'
import type { JSAggregateForecastDay, JSHourlyForecastPeriod } from '~/utils/ipma-types'
import {
  buildLocationMeta,
  buildWarningBanner,
  buildDailyRows,
  buildHourlyGrid,
  nearestObservations,
  buildObservationRows,
  buildObservationCards
} from '~/utils/transform'

interface ForecastResult {
  dataUpdate: string
  daily: JSAggregateForecastDay[]
  periods: JSHourlyForecastPeriod[]
}

const forecastCache = new Map<number, ForecastResult>()

export function useLocationForecast(id: Ref<number | null>, lang: Ref<Lang>, t: Ref<Record<string, string>>) {
  const { client } = useIpmaClient()
  const { locations, districtMap, warningsByArea, observations, labelFor } = useLocationsData()
  const settings = useSettings()

  const forecast = ref<ForecastResult | null>(null)
  const forecastLoading = ref(false)
  const forecastError = ref<string | null>(null)
  const c = computed(() => accentColors(settings.value.accent))

  async function loadForecast(locId: number) {
    if (!client.value) return
    const cached = forecastCache.get(locId)
    if (cached) {
      forecast.value = cached
      return
    }
    forecastLoading.value = true
    forecastError.value = null
    try {
      const result = await client.value.aggregateForecast(locId)
      forecastCache.set(locId, result)
      forecast.value = result
    } catch (e) {
      forecastError.value = e instanceof Error ? e.message : String(e)
    } finally {
      forecastLoading.value = false
    }
  }

  const selectedLocation = computed(() => locations.value.find(l => l.id === id.value) ?? null)

  watch([selectedLocation, client], ([loc, c]) => { if (loc && c) loadForecast(loc.id) }, { immediate: true })

  const locationMeta = computed(() => {
    if (!selectedLocation.value) return null
    const district = districtMap.value.get(selectedLocation.value.districtID)
    return buildLocationMeta(selectedLocation.value, district, forecast.value?.dataUpdate ?? null, lang.value)
  })

  const locationWarnings = computed(() => {
    if (!selectedLocation.value) return []
    return warningsByArea.value.get(selectedLocation.value.warningAreaID) ?? []
  })

  const warningBanner = computed(() => buildWarningBanner(locationWarnings.value, lang.value, t.value.warnings))

  const dailyRows = computed(() => forecast.value
    ? buildDailyRows(forecast.value.daily, lang.value, labelFor.value, weatherIconUrl)
    : []
  )

  const hourlyGrid = computed(() => forecast.value
    ? buildHourlyGrid(forecast.value.periods, lang.value, t.value, labelFor.value, weatherIconUrl, c.value.primary, settings.value.hourlyBars)
    : { dayHeaders: [], timeCols: [], hourRows: [], hourDays: [] }
  )

  const nearestObs = computed(() => selectedLocation.value
    ? nearestObservations(observations.value, selectedLocation.value.latitude, selectedLocation.value.longitude, 5)
    : []
  )

  const obsRows = computed(() => buildObservationRows(nearestObs.value))
  const obsCards = computed(() => buildObservationCards(nearestObs.value, t.value))

  return {
    forecast,
    forecastLoading,
    forecastError,
    selectedLocation,
    locationMeta,
    warningBanner,
    dailyRows,
    hourlyGrid,
    obsRows,
    obsCards,
    c
  }
}
