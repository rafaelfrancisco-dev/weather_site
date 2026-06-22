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

interface ForecastPayload {
  locationId: number | null
  forecast: ForecastResult | null
}

export function useLocationForecast(id: Ref<number | null>, lang: Ref<Lang>, t: Ref<Record<string, string>>) {
  const { locations, districtMap, warningsByArea, stations, observations, labelFor } = useLocationsData()
  const settings = useSettings()
  const requestFetch = useRequestFetch()
  const forecastCache = useState<Record<string, ForecastResult>>('ipma-forecast-client-cache', () => ({}))

  const selectedLocation = computed(() => locations.value.find(l => l.id === id.value) ?? null)
  const selectedLocationId = computed(() => selectedLocation.value?.id ?? null)
  const forecastKey = computed(() => `ipma-forecast-${selectedLocationId.value ?? 'none'}`)

  const forecastPayload = shallowRef<ForecastPayload>({ locationId: null, forecast: null })
  const forecastLoading = ref(false)
  const forecastErrorRaw = shallowRef<unknown>(null)

  if (import.meta.client) {
    let requestId = 0
    let controller: AbortController | null = null

    watch(selectedLocationId, async (locationId) => {
      requestId += 1
      const currentRequestId = requestId
      controller?.abort()
      controller = null
      forecastErrorRaw.value = null

      if (locationId == null) {
        forecastPayload.value = { locationId: null, forecast: null }
        forecastLoading.value = false
        return
      }

      const key = forecastKey.value
      const cachedForecast = forecastCache.value[key]
      forecastPayload.value = { locationId, forecast: cachedForecast ?? null }

      if (cachedForecast) {
        forecastLoading.value = false
        return
      }

      controller = new AbortController()
      forecastLoading.value = true

      try {
        const forecast = await requestFetch<ForecastResult>(`/api/forecast/${locationId}`, { signal: controller.signal })
        if (currentRequestId !== requestId || selectedLocationId.value !== locationId) return
        forecastCache.value[key] = forecast
        forecastPayload.value = { locationId, forecast }
      } catch (error) {
        if ((error as { name?: string }).name === 'AbortError') return
        if (currentRequestId === requestId && selectedLocationId.value === locationId) {
          forecastErrorRaw.value = error
        }
      } finally {
        if (currentRequestId === requestId) {
          forecastLoading.value = false
        }
      }
    }, { immediate: true, flush: 'sync' })

    onBeforeUnmount(() => {
      controller?.abort()
    })
  }

  const forecast = computed(() => {
    if (forecastPayload.value.locationId !== selectedLocationId.value) {
      return null
    }
    return forecastPayload.value.forecast
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
