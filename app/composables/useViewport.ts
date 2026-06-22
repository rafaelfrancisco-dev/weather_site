const { width } = useWindowSize({ initialWidth: 1180 })
const mobile = computed(() => width.value <= 700)

export function useViewport() {
  return { mobile }
}
