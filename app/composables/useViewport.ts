const vw = ref(1180)
const mobile = computed(() => vw.value <= 700)
let listening = false

function onResize() {
  vw.value = window.innerWidth
}

export function useViewport() {
  if (!listening) {
    listening = true
    onResize()
    window.addEventListener('resize', onResize)
  }
  return { mobile }
}
