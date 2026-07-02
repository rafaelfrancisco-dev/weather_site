import { MOBILE_MEDIA_QUERY } from '~/utils/breakpoint'

let listenerInstalled = false
let media: MediaQueryList | null = null

export function useViewport() {
  const mobile = useState('viewport-mobile', () => false)

  if (import.meta.client) {
    media ??= window.matchMedia(MOBILE_MEDIA_QUERY)
    const update = () => {
      mobile.value = media?.matches ?? false
    }

    update()
    if (!listenerInstalled) {
      listenerInstalled = true
      media.addEventListener('change', update)
    }
  }

  return { mobile }
}
