export function useViewport() {
  const mobile = ref(false)

  const update = () => {
    mobile.value = window.innerWidth <= 700
  }

  onMounted(() => {
    update()
    window.addEventListener('resize', update, { passive: true })
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', update)
  })

  return { mobile }
}
