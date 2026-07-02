import { districtHref, districtSlugMatches } from '#shared/slug'
import type { Lang } from '~/utils/i18n'
import type { MapFocus, MapGroup } from '#shared/map-types'
import { CAPITALS } from '~/utils/maps'

// Derive district group from the CAPITALS list (replaces PT_GEO lookup)
const uniqueDistricts = [...new Map(CAPITALS.map(c => [c.district, c])).values()]

export function useDistrictFocus(lang: ComputedRef<Lang>) {
  const router = useRouter()
  const route = useRoute()

  const focus = ref<MapFocus | null>(null)
  const districtMapExpanded = ref(false)

  const routeDistrictSlug = computed(() => {
    const param = route.params.districtSlug
    return typeof param === 'string' ? param : null
  })

  function groupLabel(group: MapGroup): string {
    if (group === 'madeira') return 'Madeira'
    if (group === 'azores') return lang.value === 'pt' ? 'Açores' : 'Azores'
    return lang.value === 'pt' ? 'Continente' : 'Mainland'
  }

  const focusedDistrictLabel = computed(() => focus.value?.district ?? groupLabel(focus.value?.group ?? 'mainland'))

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

  watch(routeDistrictSlug, (slug) => {
    if (!slug) {
      focus.value = null
      districtMapExpanded.value = false
      return
    }
    const found = districtForSlug(slug)
    if (!found) {
      throw createError({ statusCode: 404, statusMessage: 'District not found', fatal: true })
    }
    if (focus.value?.district !== found.name || focus.value?.group !== found.group) {
      districtMapExpanded.value = false
    }
    focus.value = { group: found.group, district: found.name }
  }, { immediate: true })

  return {
    focus,
    districtMapExpanded,
    focusedDistrictLabel,
    groupLabel,
    districtGroupFor,
    openDistrict,
    closeDistrict,
  }
}
