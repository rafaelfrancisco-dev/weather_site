<script setup lang="ts">
import type { GeoJSONSource, Map, Popup } from 'mapbox-gl'
import type { FcPoint, MapFocus, MapLayer, MapPick } from '#shared/map-types'
import { mapboxAccentColor } from '~/utils/mapColors'
import { districtWarningEntries } from '~/utils/mapDerived'
import { CAPITALS } from '~/utils/maps'
import {
  buildCapitalsGeoJSON,
  buildDistrictDataGeoJSON,
  buildLocationsGeoJSON,
  buildObsGeoJSON,
  buildSeaGeoJSON,
  type LocationForecastCacheEntry,
} from '~/utils/weather-map/geojson'
import { loadWeatherIcons } from '~/utils/weather-map/icons'
import {
  ALL_TOGGLED_LAYERS,
  initWeatherMapLayers,
  LAYER_GROUPS,
} from '~/utils/weather-map/layers'
import {
  capitalPopupNode,
  locationPopupNode,
  seaPopupNode,
  stationPopupNode,
} from '~/utils/weather-map/popups'
import { getInitialView } from '~/utils/weather-map/view'

const props = defineProps<{
  layer: MapLayer
  focus: MapFocus | null
  height: number
  forecastData: FcPoint[]
  fireData: Record<string, number>
}>()

const emit = defineEmits<{ pick: [pick: MapPick] }>()

const settings = useSettings()
const { locations, stations, observations, warningsByArea, districtMap } = useLocationsData()

const mapEl = ref<HTMLDivElement | null>(null)

const locationForecastCache = new Map<number, LocationForecastCacheEntry>()
let forecastFetchTimer: ReturnType<typeof setTimeout> | null = null
const focusCameraPadding = { top: 96, right: 56, bottom: 56, left: 56 }

const { mapReady, noToken, getMap } = useMapboxMap({
  container: mapEl,
  initialView: () => getInitialView(props.focus),
  popupMaxWidth: '220px',
  resizeOn: () => props.height,
  onLoad: async (map, _mapboxgl, popup) => {
    await loadWeatherIcons(map)
    initSources(map)
    initLayers(map)
    initInteractions(map, popup!)
    applyLayerVisibility(map)
  },
})

const districtWarnings = computed<Record<string, { type: string; level: string }>>(() => {
  return districtWarningEntries(locations.value, districtMap.value, warningsByArea.value)
})

const districtTempByName = computed<Record<string, number>>(() => {
  const result: Record<string, number> = {}
  for (const fc of props.forecastData) {
    if (fc.tmax != null) result[fc.district] = fc.tmax
  }
  return result
})

const nationalAvgTemp = computed(() => {
  const values = Object.values(districtTempByName.value)
  if (!values.length) return 20
  return values.reduce((a, b) => a + b, 0) / values.length
})

function districtSourceData() {
  return buildDistrictDataGeoJSON({
    layer: props.layer,
    districtWarnings: districtWarnings.value,
    fireData: props.fireData,
    forecastData: props.forecastData,
  })
}

function locationsSourceData() {
  return buildLocationsGeoJSON({
    locations: locations.value,
    districtMap: districtMap.value,
    locationForecastCache,
    districtTempByName: districtTempByName.value,
    nationalAvgTemp: nationalAvgTemp.value,
  })
}

function applyLayerVisibility(map: Map) {
  const active = new Set(LAYER_GROUPS[props.layer])
  for (const id of ALL_TOGGLED_LAYERS) {
    try {
      map.setLayoutProperty(id, 'visibility', active.has(id) ? 'visible' : 'none')
    } catch {
      // Layer may not exist yet during initialization.
    }
  }
  if (props.layer === 'forecast') scheduleForecastFetch()
}

function scheduleForecastFetch() {
  if (forecastFetchTimer) clearTimeout(forecastFetchTimer)
  forecastFetchTimer = setTimeout(fetchVisibleLocationForecasts, 300)
}

async function fetchVisibleLocationForecasts() {
  const map = getMap()
  if (!map || props.layer !== 'forecast') return
  let features: GeoJSON.Feature[]
  try {
    features = map.queryRenderedFeatures({ layers: ['loc-points'] })
  } catch {
    return
  }

  const idsToFetch = [...new Set(
    features
      .map(f => f.properties?.id as number | undefined)
      .filter((id): id is number => id != null && !locationForecastCache.has(id)),
  )].slice(0, 80)
  if (!idsToFetch.length) return

  for (const id of idsToFetch) locationForecastCache.set(id, { tmax: null, wt: null })

  try {
    const batch = await $fetch<{ id: string; tmax: number | null; wt: number | null }[]>('/api/map-forecast-batch', {
      query: { ids: idsToFetch.join(',') },
    })
    const returnedIds = new Set<number>()
    for (const entry of batch) {
      const id = Number(entry.id)
      returnedIds.add(id)
      locationForecastCache.set(id, { tmax: entry.tmax, wt: entry.wt })
    }
    for (const id of idsToFetch) {
      if (!returnedIds.has(id)) locationForecastCache.delete(id)
    }
    if (mapReady.value) {
      (map.getSource('locations') as GeoJSONSource | undefined)?.setData(locationsSourceData())
    }
  } catch {
    for (const id of idsToFetch) locationForecastCache.delete(id)
  }
}

function initSources(map: Map) {
  map.addSource('districts', { type: 'geojson', data: districtSourceData() })
  map.addSource('obs', { type: 'geojson', data: buildObsGeoJSON(stations.value, observations.value) })
  map.addSource('locations', {
    type: 'geojson',
    data: locationsSourceData(),
    cluster: true,
    clusterMaxZoom: 10,
    clusterRadius: 50,
    clusterProperties: {
      tempSum: ['+', ['get', 'clusterTemp']],
    },
  })
  map.addSource('capitals', { type: 'geojson', data: buildCapitalsGeoJSON(props.forecastData) })
  map.addSource('sea', { type: 'geojson', data: buildSeaGeoJSON() })
}

function initLayers(map: Map) {
  initWeatherMapLayers(map, mapboxAccentColor(settings.value.accent))
}

function initInteractions(map: Map, popup: Popup) {
  map.on('moveend', scheduleForecastFetch)

  map.on('click', 'loc-clusters', (e) => {
    const feats = map.queryRenderedFeatures(e.point, { layers: ['loc-clusters'] })
    if (!feats.length) return
    const clusterId = feats[0].properties!.cluster_id as number
    const coords = (feats[0].geometry as GeoJSON.Point).coordinates as [number, number]
    const src = map.getSource('locations') as GeoJSONSource
    src.getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err || typeof zoom !== 'number' || !Number.isFinite(zoom)) {
        map.easeTo({ center: coords, zoom: map.getZoom() + 2 })
        return
      }
      map.easeTo({ center: coords, zoom })
    })
  })

  for (const layer of ['loc-points', 'loc-icons']) {
    map.on('click', layer, (e) => {
      const feat = e.features?.[0]
      if (!feat) return
      const p = feat.properties!
      emit('pick', { kind: 'location', id: String(p.id), name: p.name as string })
    })
  }

  map.on('click', 'capitals-uv-circles', (e) => {
    const feat = e.features?.[0]
    if (!feat) return
    const p = feat.properties!
    emit('pick', { kind: 'location', id: String(p.id), name: p.name as string })
  })

  const clickable = ['loc-clusters', 'loc-points', 'loc-icons', 'obs-circles', 'sea-circles', 'capitals-uv-circles']
  for (const layer of clickable) {
    map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer' })
    map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = '' })
  }

  map.on('mouseenter', 'obs-circles', (e) => {
    const feat = e.features?.[0]
    if (!feat) return
    const p = feat.properties!
    const coords = (feat.geometry as GeoJSON.Point).coordinates as [number, number]
    popup.setLngLat(coords).setDOMContent(stationPopupNode(p.stationName, p.temperature, p.color)).addTo(map)
  })
  map.on('mouseleave', 'obs-circles', () => popup.remove())

  map.on('mouseenter', 'capitals-uv-circles', (e) => {
    const feat = e.features?.[0]
    if (!feat) return
    const p = feat.properties!
    const coords = (feat.geometry as GeoJSON.Point).coordinates as [number, number]
    popup.setLngLat(coords).setDOMContent(capitalPopupNode(p)).addTo(map)
  })
  map.on('mouseleave', 'capitals-uv-circles', () => popup.remove())

  for (const layer of ['loc-points', 'loc-icons']) {
    map.on('mouseenter', layer, (e) => {
      const feat = e.features?.[0]
      if (!feat) return
      const p = feat.properties!
      const coords = (feat.geometry as GeoJSON.Point).coordinates as [number, number]
      popup.setLngLat(coords).setDOMContent(locationPopupNode(p.name, p.tempLabel, p.tempTextColor)).addTo(map)
    })
    map.on('mouseleave', layer, () => popup.remove())
  }

  map.on('mouseenter', 'sea-circles', (e) => {
    const feat = e.features?.[0]
    if (!feat) return
    const p = feat.properties!
    const coords = (feat.geometry as GeoJSON.Point).coordinates as [number, number]
    popup.setLngLat(coords).setDOMContent(seaPopupNode(p)).addTo(map)
  })
  map.on('mouseleave', 'sea-circles', () => popup.remove())
}

watch(
  [() => props.layer, () => props.forecastData, districtWarnings],
  () => {
    const map = getMap()
    if (!mapReady.value || !map) return
    ;(map.getSource('districts') as GeoJSONSource | undefined)?.setData(districtSourceData())
    applyLayerVisibility(map)
  },
  { deep: false },
)

watch(
  [stations, observations],
  () => {
    const map = getMap()
    if (!mapReady.value || !map) return
    ;(map.getSource('obs') as GeoJSONSource | undefined)?.setData(buildObsGeoJSON(stations.value, observations.value))
  },
  { deep: false },
)

watch(
  locations,
  () => {
    const map = getMap()
    if (!mapReady.value || !map) return
    ;(map.getSource('locations') as GeoJSONSource | undefined)?.setData(locationsSourceData())
  },
  { deep: false },
)

watch(
  () => props.forecastData,
  () => {
    const map = getMap()
    if (!mapReady.value || !map) return
    ;(map.getSource('capitals') as GeoJSONSource | undefined)?.setData(buildCapitalsGeoJSON(props.forecastData))
  },
  { deep: false },
)

watch(
  () => props.focus,
  (newFocus) => {
    const map = getMap()
    if (!mapReady.value || !map) return
    const district = newFocus?.district
    const group = newFocus?.group
    if (district) {
      const cap = CAPITALS.find(c => c.district === district)
      if (cap) {
        map.flyTo({ center: [cap.lon, cap.lat], zoom: 9, duration: 600, padding: focusCameraPadding })
        return
      }
    }
    if (group === 'madeira') {
      map.flyTo({ center: [-16.9, 32.65], zoom: 10, duration: 600, padding: focusCameraPadding })
      return
    }
    if (group === 'azores') {
      map.flyTo({ center: [-27.2, 38.6], zoom: 7, duration: 600, padding: focusCameraPadding })
      return
    }
    map.flyTo({ center: [-8.2, 39.5], zoom: 6.3, duration: 600, padding: focusCameraPadding })
  },
)
</script>

<template>
  <div :style="{ position: 'relative', width: '100%', height: `${props.height}px` }">
    <div ref="mapEl" style="position:absolute;inset:0;border-radius:inherit;" />

    <div
      v-if="noToken"
      style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:var(--bg-page);font-size:13px;color:var(--text-muted);text-align:center;padding:24px;border-radius:inherit;"
    >
      Set <code>NUXT_PUBLIC_MAPBOX_TOKEN</code> to enable the map.
    </div>

    <div
      v-else-if="!mapReady"
      style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:var(--bg-page);font-size:13px;color:var(--text-muted);border-radius:inherit;"
    >
      Loading map…
    </div>
  </div>
</template>
