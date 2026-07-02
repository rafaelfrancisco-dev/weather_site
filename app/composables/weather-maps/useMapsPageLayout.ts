import type { Lang } from '~/utils/i18n'

export function useMapsPageLayout(districtMapExpanded: Ref<boolean>, lang: ComputedRef<Lang>) {
  const { mobile } = useViewport()

  const primaryHeight = computed(() => mobile.value ? 430 : 640)
  const focusHeight = computed(() => mobile.value ? 440 : 560)
  const expandedFocusHeight = computed(() => mobile.value ? 620 : 760)
  const activeFocusHeight = computed(() => districtMapExpanded.value ? expandedFocusHeight.value : focusHeight.value)
  const districtMapToggleLabel = computed(() => {
    if (districtMapExpanded.value) return lang.value === 'pt' ? 'Reduzir mapa' : 'Shrink map'
    return lang.value === 'pt' ? 'Expandir mapa' : 'Expand map'
  })

  return {
    primaryHeight,
    activeFocusHeight,
    districtMapToggleLabel,
  }
}
