import { districtHref, districtSlugMatches, locationHref } from '#shared/slug'
import type { FcPoint, MapFocus, MapGroup, MapLayer, MapPick, WarnEntry } from '#shared/map-types'
import { strings } from '~/utils/i18n'
import { accentColors, fireColor, levelColor, levelRank, tempFill, uvColor, waveFill } from '~/utils/colors'
import type { WarningLevel } from '~/utils/colors'
import { dateTimeLabel } from '~/utils/format'
import { regionLabel } from '~/utils/transform'
import { CAPITALS, FIRE, iconSvg, isNowDaytime } from '~/utils/maps'
import { districtWarningEntries } from '~/utils/mapDerived'

interface LayerDef {
  id: MapLayer
  label: string
  swatchColor: string
  unit: string
  hint: string
  legendTitle: string
  legendStops: { label: string; color: string }[]
}

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
const { mobile } = useViewport()
const router = useRouter()
const route = useRoute()

const lang = computed(() => settings.value.lang)
const t = computed(() => strings(lang.value))
const c = computed(() => accentColors(settings.value.accent))

const activeLayer = ref<MapLayer>('forecast')
const focus = ref<MapFocus | null>(null)
const districtMapExpanded = ref(false)

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

const layerDefs = computed<LayerDef[]>(() => [
  {
    id: 'forecast',
    label: t.value.forecast,
    swatchColor: 'oklch(0.78 0.14 62)',
    unit: '°C',
    hint: lang.value === 'pt' ? 'Máximas de hoje nas capitais de distrito.' : "Today's district-capital highs.",
    legendTitle: lang.value === 'pt' ? 'Temperatura °C' : 'Temperature °C',
    legendStops: [4, 9, 13, 17, 21, 25, 29, 33, 37].map(value => ({ label: String(value), color: tempFill(value) })),
  },
  {
    id: 'observations',
    label: t.value.obs,
    swatchColor: 'oklch(0.55 0.13 235)',
    unit: '°C',
    hint: lang.value === 'pt' ? 'Últimas temperaturas de estações automáticas.' : 'Latest automatic-station temperatures.',
    legendTitle: lang.value === 'pt' ? 'Temperatura °C' : 'Temperature °C',
    legendStops: [4, 9, 13, 17, 21, 25, 29, 33, 37].map(value => ({ label: String(value), color: tempFill(value) })),
  },
  {
    id: 'warnings',
    label: t.value.warnings,
    swatchColor: 'oklch(0.70 0.16 58)',
    unit: '',
    hint: lang.value === 'pt' ? 'Distritos com avisos ativos.' : 'Districts with active warnings.',
    legendTitle: lang.value === 'pt' ? 'Nível de aviso' : 'Awareness level',
    legendStops: [
      { label: lang.value === 'pt' ? 'Verde' : 'Green', color: levelColor('green') },
      { label: lang.value === 'pt' ? 'Amarelo' : 'Yellow', color: levelColor('yellow') },
      { label: lang.value === 'pt' ? 'Laranja' : 'Orange', color: levelColor('orange') },
      { label: lang.value === 'pt' ? 'Vermelho' : 'Red', color: levelColor('red') },
    ],
  },
  {
    id: 'fire',
    label: t.value.mapFire,
    swatchColor: 'oklch(0.57 0.20 30)',
    unit: '1-5',
    hint: lang.value === 'pt' ? 'Escala estática de referência por distrito.' : 'Static reference scale by district.',
    legendTitle: lang.value === 'pt' ? 'Risco de incêndio' : 'Fire risk',
    legendStops: [
      { label: '1', color: fireColor(1) },
      { label: '2', color: fireColor(2) },
      { label: '3', color: fireColor(3) },
      { label: '4', color: fireColor(4) },
      { label: '5', color: fireColor(5) },
    ],
  },
  {
    id: 'uv',
    label: t.value.mapUv,
    swatchColor: 'oklch(0.55 0.18 320)',
    unit: 'UV',
    hint: lang.value === 'pt' ? 'Índice UV máximo previsto.' : 'Forecast maximum UV index.',
    legendTitle: t.value.mapUv,
    legendStops: [
      { label: 'Low', color: uvColor(2) },
      { label: 'Moderate', color: uvColor(4) },
      { label: 'High', color: uvColor(7) },
      { label: 'Very high', color: uvColor(9) },
      { label: 'Extreme', color: uvColor(11) },
    ],
  },
  {
    id: 'sea',
    label: t.value.mapSea,
    swatchColor: 'oklch(0.52 0.14 252)',
    unit: 'm',
    hint: lang.value === 'pt' ? 'Pontos costeiros de referência.' : 'Reference coastal points.',
    legendTitle: lang.value === 'pt' ? 'Altura de onda' : 'Wave height',
    legendStops: [
      { label: '1m', color: waveFill(1) },
      { label: '2m', color: waveFill(2) },
      { label: '3m', color: waveFill(3) },
      { label: '4m', color: waveFill(4) },
      { label: '5m', color: waveFill(5) },
    ],
  },
])

const activeLayerDef = computed(() => layerDefs.value.find(def => def.id === activeLayer.value) ?? layerDefs.value[0])

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

const primaryHeight = computed(() => mobile.value ? 430 : 640)
const focusHeight = computed(() => mobile.value ? 440 : 560)
const expandedFocusHeight = computed(() => mobile.value ? 620 : 760)
const activeFocusHeight = computed(() => districtMapExpanded.value ? expandedFocusHeight.value : focusHeight.value)
const districtMapToggleLabel = computed(() => {
  if (districtMapExpanded.value) return lang.value === 'pt' ? 'Reduzir mapa' : 'Shrink map'
  return lang.value === 'pt' ? 'Expandir mapa' : 'Expand map'
})

const focusedDistrictLabel = computed(() => focus.value?.district ?? groupLabel(focus.value?.group ?? 'mainland'))

const capitalNames = computed(() => new Set(CAPITALS.map(c => c.name)))
const routeDistrictSlug = computed(() => {
  const param = route.params.districtSlug
  return typeof param === 'string' ? param : null
})

function isCapitalLoc(loc: { name: string }): boolean {
  return capitalNames.value.has(loc.name)
}

const focusedLocations = computed(() => {
  if (!focus.value) return []
  return locations.value
    .filter((loc) => {
      if (focus.value?.group === 'mainland') {
        const district = districtMap.value.get(loc.districtID)
        return district?.name === focus.value.district
      }
      return loc.regionID === (focus.value.group === 'madeira' ? 2 : 3)
    })
    .slice()
    .sort((a, b) => {
      const aC = capitalNames.value.has(a.name) ? 0 : 1
      const bC = capitalNames.value.has(b.name) ? 0 : 1
      if (aC !== bC) return aC - bC
      return a.name.localeCompare(b.name)
    })
})

const focusedDistrictWarning = computed(() =>
  focus.value?.district ? districtWarnings.value[focus.value.district] : null
)

interface LocFc { tmax: number | null; tmin: number | null; wt: number | null }
const districtLocationForecasts = ref<Record<number, LocFc>>({})

watch(focusedLocations, async (locs) => {
  if (!import.meta.client || !locs.length) return
  const toFetch = locs.filter(loc => !(loc.id in districtLocationForecasts.value))
  if (!toFetch.length) return
  await Promise.allSettled(
    toFetch.map(async (loc) => {
      try {
        const fc = await $fetch(`/api/forecast/${loc.id}`) as { daily: { tMax: number; tMin: number; weatherTypeID: number }[] }
        const today = fc?.daily?.[0]
        districtLocationForecasts.value[loc.id] = {
          tmax: today?.tMax ?? null,
          tmin: today?.tMin ?? null,
          wt: today?.weatherTypeID ?? null,
        }
      } catch {
        districtLocationForecasts.value[loc.id] = { tmax: null, tmin: null, wt: null }
      }
    })
  )
}, { immediate: false })


function groupLabel(group: MapGroup): string {
  if (group === 'madeira') return 'Madeira'
  if (group === 'azores') return lang.value === 'pt' ? 'Açores' : 'Azores'
  return lang.value === 'pt' ? 'Continente' : 'Mainland'
}

function setLayer(nextLayer: MapLayer) {
  activeLayer.value = nextLayer
}

// Derive district group from the CAPITALS list (replaces PT_GEO lookup)
const uniqueDistricts = [...new Map(CAPITALS.map(c => [c.district, c])).values()]

function districtGroupFor(name: string): MapGroup {
  return (uniqueDistricts.find(c => c.district === name)?.group as MapGroup) ?? 'mainland'
}

function districtForSlug(slug: string): { name: string; group: MapGroup } | null {
  const found = uniqueDistricts.find(c => districtSlugMatches(c.district, slug))
  if (!found) return null
  return { name: found.district, group: found.group as MapGroup }
}

function openDistrict(name: string, group?: MapGroup) {
  focus.value = { group: group ?? districtGroupFor(name), district: name }
  districtMapExpanded.value = false
  const nextPath = districtHref(name)
  if (route.path !== nextPath) router.push(nextPath)
}

function closeDistrict() {
  focus.value = null
  districtMapExpanded.value = false
  if (route.path !== '/maps') router.push('/maps')
}

function handlePick(pick: MapPick) {
  if (pick.kind === 'location' && (activeLayer.value === 'forecast' || activeLayer.value === 'uv')) {
    const id = Number(pick.id)
    if (Number.isFinite(id)) router.push(locationHref(id, pick.name))
  }
}

function locationRegion(loc: { regionID: number; districtID: number }) {
  if (loc.regionID === 1) return districtMap.value.get(loc.districtID)?.name ?? regionLabel(loc.regionID, lang.value)
  return regionLabel(loc.regionID, lang.value)
}

function locationForecast(loc: { id: number; name: string }) {
  return forecastData.value.find(point => point.id === String(loc.id) || point.name === loc.name)
}

function locationData(loc: { id: number; name: string }): LocFc | null {
  if (loc.id in districtLocationForecasts.value) return districtLocationForecasts.value[loc.id]
  const fc = locationForecast(loc)
  if (!fc) return null
  return { tmax: fc.tmax, tmin: fc.tmin, wt: fc.wt }
}

function legendTextColor(index: number) {
  if (activeLayer.value === 'warnings' && index === 1) return 'oklch(0.3 0.05 90)'
  if (activeLayer.value === 'forecast' || activeLayer.value === 'observations') {
    const value = Number(activeLayerDef.value.legendStops[index]?.label)
    return value >= 29 || value <= 9 ? '#fff' : 'oklch(0.25 0.02 255)'
  }
  return index >= activeLayerDef.value.legendStops.length - 2 ? '#fff' : 'oklch(0.25 0.03 60)'
}

watch(routeDistrictSlug, (slug) => {
  if (!slug) {
    focus.value = null
    districtMapExpanded.value = false
    return
  }
  const found = districtForSlug(slug)
  if (!found) {
    focus.value = null
    districtMapExpanded.value = false
    return
  }
  if (focus.value?.district !== found.name || focus.value?.group !== found.group) {
    districtMapExpanded.value = false
  }
  focus.value = { group: found.group, district: found.name }
}, { immediate: true })


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
