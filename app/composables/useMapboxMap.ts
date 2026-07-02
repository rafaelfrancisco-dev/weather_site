import type { Map, Popup } from 'mapbox-gl'
import type { ComputedRef, Ref, WatchSource } from 'vue'

export type MapboxGL = typeof import('mapbox-gl')['default']

export interface UseMapboxMapOptions {
  container: Ref<HTMLElement | null>
  /** Evaluated at mount time, not reactively. */
  initialView: () => { center: [number, number]; zoom: number }
  scrollZoom?: boolean
  /** When set, a shared hover Popup ({ closeButton: false, closeOnClick: false }) is created. */
  popupMaxWidth?: string
  /** Triggers map.resize() on nextTick when it changes (e.g. a height prop). */
  resizeOn?: WatchSource<unknown>
  onLoad: (map: Map, mapboxgl: MapboxGL, popup: Popup | null) => void | Promise<void>
}

export interface UseMapboxMapReturn {
  mapReady: Ref<boolean>
  noToken: ComputedRef<boolean>
  getMap: () => Map | null
  getPopup: () => Popup | null
}

/**
 * Shared mapbox-gl lifecycle: token check, lazy import, light-v11 style,
 * load/unmount handling. The Map and Popup instances are deliberately plain
 * closure variables — never wrap them in ref()/reactive(), Vue's proxying
 * breaks Mapbox internals — so they are exposed only via getters.
 */
export function useMapboxMap(options: UseMapboxMapOptions): UseMapboxMapReturn {
  const config = useRuntimeConfig()

  const mapReady = ref(false)
  const noToken = computed(() => !config.public.mapboxToken)

  let map: Map | null = null
  let popup: Popup | null = null

  onMounted(async () => {
    if (!config.public.mapboxToken) return

    const mapboxgl = (await import('mapbox-gl')).default
    mapboxgl.accessToken = config.public.mapboxToken as string

    const { center, zoom } = options.initialView()

    map = new mapboxgl.Map({
      container: options.container.value!,
      style: 'mapbox://styles/mapbox/light-v11',
      center,
      zoom,
      attributionControl: false,
      scrollZoom: options.scrollZoom ?? true,
    })

    if (options.popupMaxWidth) {
      popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, maxWidth: options.popupMaxWidth })
    }

    map.on('load', async () => {
      await options.onLoad(map!, mapboxgl, popup)
      mapReady.value = true
    })
  })

  onUnmounted(() => {
    map?.remove()
    map = null
    popup = null
  })

  if (options.resizeOn) {
    watch(options.resizeOn, () => {
      if (!mapReady.value || !map) return
      nextTick(() => {
        map?.resize()
      })
    })
  }

  return {
    mapReady,
    noToken,
    getMap: () => map,
    getPopup: () => popup,
  }
}
