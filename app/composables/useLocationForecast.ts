import type { Lang } from '~/utils/i18n'
import { weatherIconUrl } from '~/utils/format'
import { accentColors } from '~/utils/colors'
import type { JSAggregateForecastDay, JSHourlyForecastPeriod } from '#shared/ipma-types'
import {
  buildLocationMeta,
  buildWarningBanner,
  buildDailyRows,
  buildHourlyGrid,
  buildObservationGrid
} from '~/utils/transform'

interface ForecastResult {
  dataUpdate: string
  daily: JSAggregateForecastDay[]
  periods: JSHourlyForecastPeriod[]
}

export function useLocationForecast(id: Ref<number | null>, lang: Ref<Lang>, t: Ref<Record<string, string>>) {
  const { locations, districtMap, warningsByArea, stations, observations, labelFor } = useLocationsData()
  const settings = useSettings()
  const requestFetch = useRequestFetch()

  const selectedLocation = computed(() => locations.value.find(l => l.id === id.value) ?? null)

  const { data: forecast, pending: forecastLoading, error: forecastErrorRaw } = useAsyncData<ForecastResult | null>(
    () => `ipma-forecast-${selectedLocation.value?.id ?? 'none'}`,
    () => selectedLocation.value
      ? requestFetch<ForecastResult>(`/api/forecast/${selectedLocation.value.id}`)
      : Promise.resolve(null)
  )

  const forecastError = computed(() => forecastErrorRaw.value
    ? (forecastErrorRaw.value.message ?? String(forecastErrorRaw.value))
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

  const warningBanner = computed(() => buildWarningBanner(locationWarnings.value, lang.value, t.value.warnings))

  const dailyRows = computed(() => forecast.value
    ? buildDailyRows(forecast.value.daily, lang.value, labelFor.value, weatherIconUrl)
    : []
  )

  const hourlyGrid = computed(() => forecast.value
    ? buildHourlyGrid(forecast.value.periods, lang.value, t.value, labelFor.value, weatherIconUrl, c.value.primary, settings.value.hourlyBars)
    : { dayHeaders: [], timeCols: [], hourRows: [], hourDays: [] }
  )

  const observationGrid = computed(() => selectedLocation.value
    ? buildObservationGrid(stations.value, observations.value, selectedLocation.value.latitude, selectedLocation.value.longitude, lang.value, t.value, c.value.primary, c.value.soft)
    : buildObservationGrid([], [], 0, 0, lang.value, t.value, c.value.primary, c.value.soft)
  )

  return {
    forecast,
    forecastLoading,
    forecastError,
    selectedLocation,
    locationMeta,
    warningBanner,
    dailyRows,
    hourlyGrid,
    observationGrid,
    c
  }
}
