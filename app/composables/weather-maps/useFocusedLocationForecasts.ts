import type { FcPoint, MapFocus, WarnEntry } from '#shared/map-types'
import type { Lang } from '~/utils/i18n'
import { CAPITALS } from '~/utils/maps'
import { regionLabel } from '~/utils/transform'

interface LocFc { tmax: number | null; tmin: number | null; wt: number | null }

export function useFocusedLocationForecasts(
  focus: Ref<MapFocus | null>,
  lang: ComputedRef<Lang>,
  districtWarnings: ComputedRef<Record<string, WarnEntry>>,
  forecastData: ComputedRef<FcPoint[]>,
) {
  const { locations, districtMap } = useLocationsData()

  const capitalNames = computed(() => new Set(CAPITALS.map(c => c.name)))

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

  function locationRegion(loc: { regionID: number; districtID: number }) {
    if (loc.regionID === 1) return districtMap.value.get(loc.districtID)?.name ?? regionLabel(loc.regionID, lang.value)
    return regionLabel(loc.regionID, lang.value)
  }

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

  function locationForecast(loc: { id: number; name: string }) {
    return forecastData.value.find(point => point.id === String(loc.id) || point.name === loc.name)
  }

  function locationData(loc: { id: number; name: string }): LocFc | null {
    if (loc.id in districtLocationForecasts.value) return districtLocationForecasts.value[loc.id]
    const fc = locationForecast(loc)
    if (!fc) return null
    return { tmax: fc.tmax, tmin: fc.tmin, wt: fc.wt }
  }

  return {
    focusedLocations,
    focusedDistrictWarning,
    isCapitalLoc,
    locationRegion,
    locationData,
  }
}
