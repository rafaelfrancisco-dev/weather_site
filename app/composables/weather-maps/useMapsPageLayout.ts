import type { Lang } from '~/utils/i18n'

export function useMapsPageLayout(districtMapExpanded: Ref<boolean>, lang: ComputedRef<Lang>) {
  const districtMapToggleLabel = computed(() => {
    if (districtMapExpanded.value) return lang.value === 'pt' ? 'Reduzir mapa' : 'Shrink map'
    return lang.value === 'pt' ? 'Expandir mapa' : 'Expand map'
  })

  return {
    districtMapToggleLabel,
  }
}
