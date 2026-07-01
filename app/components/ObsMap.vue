<script setup lang="ts">
import type { Map, GeoJSONSource } from 'mapbox-gl'
import { mapboxTempColor, mapboxAccentColor, mapboxObsValueColor } from '~/utils/mapColors'

const props = defineProps<{
  center: { lat: number; lon: number }
  locationName?: string
  maxStations?: number
}>()

const { mobile } = useViewport()
const settings = useSettings()
const config = useRuntimeConfig()
const { stations, observations } = useLocationsData()

const mapEl = ref<HTMLDivElement | null>(null)
const mapReady = ref(false)

let map: Map | null = null

// Compute nearest stations with their latest temperature
const nearestObs = computed(() => {
  const stationMap = new Map(stations.value.map(s => [s.id, s]))
  const latest = new Map<number, number>()
  const sorted = [...observations.value].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  for (const obs of sorted) {
    if (!latest.has(obs.stationID) && obs.temperature != null) latest.set(obs.stationID, obs.temperature)
  }

  const max = props.maxStations ?? 5
  return [...latest.entries()]
    .map(([id, temp]) => {
      const s = stationMap.get(id)
      if (!s) return null
      const dlat = s.latitude - props.center.lat
      const dlon = s.longitude - props.center.lon
      return { id, name: s.name, lat: s.latitude, lon: s.longitude, temp, dist: dlat * dlat + dlon * dlon }
    })
    .filter(Boolean)
    .sort((a, b) => a!.dist - b!.dist)
    .slice(0, max) as { id: number; name: string; lat: number; lon: number; temp: number; dist: number }[]
})

function buildGeoJSON(): GeoJSON.FeatureCollection {
  const stationFeatures: GeoJSON.Feature[] = nearestObs.value.map(obs => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [obs.lon, obs.lat] },
    properties: {
      type: 'station',
      stationName: obs.name,
      temperature: obs.temp,
      color: mapboxTempColor(obs.temp),
      tempLabel: `${obs.temp}°`,
      labelColor: mapboxObsValueColor(obs.temp),
    },
  }))

  const centerFeature: GeoJSON.Feature = {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [props.center.lon, props.center.lat] },
    properties: { type: 'center', name: props.locationName ?? '' },
  }

  return { type: 'FeatureCollection', features: [...stationFeatures, centerFeature] }
}

onMounted(async () => {
  if (!config.public.mapboxToken) return

  const mapboxgl = (await import('mapbox-gl')).default
  mapboxgl.accessToken = config.public.mapboxToken as string

  map = new mapboxgl.Map({
    container: mapEl.value!,
    style: 'mapbox://styles/mapbox/light-v11',
    center: [props.center.lon, props.center.lat],
    zoom: 9,
    attributionControl: false,
    scrollZoom: false,
  })

  const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, maxWidth: '200px' })

  map.on('load', () => {
    map!.addSource('obs-mini', { type: 'geojson', data: buildGeoJSON() })

    map!.addLayer({
      id: 'obs-mini-circles',
      type: 'circle',
      source: 'obs-mini',
      filter: ['==', ['get', 'type'], 'station'],
      paint: {
        'circle-color': ['get', 'color'],
        'circle-radius': 8,
        'circle-stroke-width': 1.5,
        'circle-stroke-color': '#fff',
      },
    })

    map!.addLayer({
      id: 'center-marker',
      type: 'circle',
      source: 'obs-mini',
      filter: ['==', ['get', 'type'], 'center'],
      paint: {
        'circle-color': mapboxAccentColor(settings.value.accent),
        'circle-radius': 11,
        'circle-stroke-width': 2.5,
        'circle-stroke-color': '#fff',
      },
    })

    map!.addLayer({
      id: 'obs-mini-value-labels',
      type: 'symbol',
      source: 'obs-mini',
      filter: ['==', ['get', 'type'], 'station'],
      layout: {
        'text-field': ['get', 'tempLabel'],
        'text-size': 11,
        'text-offset': [0, 0],
        'text-font': ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
        'text-allow-overlap': true,
      },
      paint: {
        'text-color': ['get', 'labelColor'],
        'text-halo-color': 'rgba(0,0,0,0.12)',
        'text-halo-width': 0.4,
      },
    })

    map!.addLayer({
      id: 'obs-mini-labels',
      type: 'symbol',
      source: 'obs-mini',
      filter: ['==', ['get', 'type'], 'station'],
      minzoom: 10,
      layout: {
        'text-field': ['get', 'stationName'],
        'text-size': 11,
        'text-offset': [0, 1.5],
        'text-font': ['DIN Offc Pro Regular', 'Arial Unicode MS Regular'],
      },
      paint: {
        'text-color': '#3e4860',
        'text-halo-color': '#fff',
        'text-halo-width': 1.6,
      },
    })

    map!.on('mouseenter', 'obs-mini-circles', (e) => {
      const feat = e.features?.[0]
      if (!feat) return
      map!.getCanvas().style.cursor = 'pointer'
      const p = feat.properties!
      const coords = (feat.geometry as GeoJSON.Point).coordinates as [number, number]
      popup
        .setLngLat(coords)
        .setHTML(`<div style="font-family:'IBM Plex Sans',sans-serif;padding:5px 8px;">
          <div style="font-size:12px;font-weight:600;color:#1e2a3a;margin-bottom:2px;">${p.stationName}</div>
          ${p.temperature != null ? `<span style="font-family:'IBM Plex Mono',monospace;font-size:15px;font-weight:600;color:${p.color};">${p.temperature}°</span>` : ''}
        </div>`)
        .addTo(map!)
    })
    map!.on('mouseleave', 'obs-mini-circles', () => {
      map!.getCanvas().style.cursor = ''
      popup.remove()
    })

    // Fit bounds to show all markers
    const allCoords: [number, number][] = [
      [props.center.lon, props.center.lat],
      ...nearestObs.value.map(o => [o.lon, o.lat] as [number, number]),
    ]
    if (allCoords.length > 1) {
      const bounds = allCoords.reduce(
        (b, c) => b.extend(c),
        new mapboxgl.LngLatBounds(allCoords[0], allCoords[0]),
      )
      map!.fitBounds(bounds, { padding: 50, maxZoom: 12 })
    }

    mapReady.value = true
  })
})

onUnmounted(() => {
  map?.remove()
  map = null
})

watch(
  nearestObs,
  () => {
    if (!mapReady.value || !map) return
    ;(map.getSource('obs-mini') as GeoJSONSource | undefined)?.setData(buildGeoJSON())
  },
  { deep: false },
)
</script>

<template>
  <div style="margin-bottom:16px;border:1px solid oklch(0.89 0.008 255);border-radius:7px;overflow:hidden;position:relative;">
    <div ref="mapEl" :style="{ height: mobile ? '160px' : '200px' }" />
  </div>
</template>
