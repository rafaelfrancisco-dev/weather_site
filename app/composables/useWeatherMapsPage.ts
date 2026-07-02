import { locationHref } from '#shared/slug'
import type { FcPoint, MapGroup, MapPick, WarnEntry } from '#shared/map-types'
import { strings } from '~/utils/i18n'
import { accentColors, levelColor, levelRank } from '~/utils/colors'
import type { WarningLevel } from '~/utils/colors'
import { dateTimeLabel } from '~/utils/format'
import { FIRE, iconSvg, isNowDaytime } from '~/utils/maps'
import { districtWarningEntries } from '~/utils/mapDerived'
import { useMapLayers } from '~/composables/weather-maps/useMapLayers'
import { useDistrictFocus } from '~/composables/weather-maps/useDistrictFocus'
import { useFocusedLocationForecasts } from '~/composables/weather-maps/useFocusedLocationForecasts'
import { useMapsPageLayout } from '~/composables/weather-maps/useMapsPageLayout'

interface WarningSummary {
  name: string
  type: string
  level: WarningLevel
  color: string
  soft: string
  group: MapGroup
}

export function useWeatherMapsPage() {
  const settings = useSettings()
  const router = useRouter()

  const lang = computed(() => settings.value.lang)
  const t = computed(() => strings(lang.value))
  const c = computed(() => accentColors(settings.value.accent))

  const {
    locations,
    observations,
    warningsByArea,
    districtMap,
    bootstrapped,
  } = useLocationsData()

  const { data: rawForecast } = useFetch<FcPoint[]>('/api/map-forecast')
  const forecastData = computed<FcPoint[]>(() => rawForecast.value ?? [])

  const districtWarnings = computed<Record<string, WarnEntry>>(() => {
    return districtWarningEntries(locations.value, districtMap.value, warningsByArea.value)
  })

  const { activeLayer, layerDefs, activeLayerDef, setLayer, legendTextColor } = useMapLayers(lang, t)

  const { focus, districtMapExpanded, focusedDistrictLabel, groupLabel, districtGroupFor, openDistrict, closeDistrict } =
    useDistrictFocus(lang)

  const { focusedLocations, focusedDistrictWarning, isCapitalLoc, locationRegion, locationData } =
    useFocusedLocationForecasts(focus, lang, districtWarnings, forecastData)

  const { primaryHeight, activeFocusHeight, districtMapToggleLabel } = useMapsPageLayout(districtMapExpanded, lang)

  const latestObservation = computed(() => {
    const latest = observations.value.reduce<string | null>((max, obs) => {
      if (!max || new Date(obs.time).getTime() > new Date(max).getTime()) return obs.time
      return max
    }, null)
    return latest ? dateTimeLabel(new Date(latest), lang.value) : dateTimeLabel(new Date(), lang.value)
  })

  const warningsSummary = computed<WarningSummary[]>(() =>
    Object.entries(districtWarnings.value)
      .map(([name, warning]) => {
        const level = warning.level as WarningLevel
        return {
          name,
          type: warning.type,
          level,
          color: levelColor(level),
          soft: `color-mix(in srgb, ${levelColor(level)} 13%, white)`,
          group: districtGroupFor(name),
        }
      })
      .sort((a, b) => levelRank(b.level) - levelRank(a.level) || a.name.localeCompare(b.name))
  )

  function handlePick(pick: MapPick) {
    if (pick.kind === 'location' && (activeLayer.value === 'forecast' || activeLayer.value === 'uv')) {
      const id = Number(pick.id)
      if (Number.isFinite(id)) router.push(locationHref(id, pick.name))
    }
  }

  return {
    activeFocusHeight,
    activeLayer,
    activeLayerDef,
    bootstrapped,
    c,
    closeDistrict,
    districtMapExpanded,
    districtMapToggleLabel,
    FIRE,
    focus,
    focusedDistrictLabel,
    focusedDistrictWarning,
    focusedLocations,
    forecastData,
    groupLabel,
    handlePick,
    iconSvg,
    isCapitalLoc,
    isNowDaytime,
    lang,
    latestObservation,
    layerDefs,
    legendTextColor,
    levelColor,
    locationData,
    locationHref,
    locationRegion,
    openDistrict,
    primaryHeight,
    setLayer,
    t,
    warningsSummary,
  }
}
