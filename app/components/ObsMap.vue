<script setup lang="ts">
import type { GeoJSONSource } from 'mapbox-gl'
import { mapboxTempColor, mapboxAccentColor, mapboxObsValueColor } from '~/utils/mapColors'
import { nearestObservationStations } from '~/utils/mapDerived'
import { stationPopupNode } from '~/utils/weather-map/popups'

const props = defineProps<{
  center: { lat: number; lon: number }
  locationName?: string
  maxStations?: number
}>()

const { mobile } = useViewport()
const settings = useSettings()
const { stations, observations } = useLocationsData()

const mapEl = ref<HTMLDivElement | null>(null)

const nearestObs = computed(() => {
  const max = props.maxStations ?? 5
  return nearestObservationStations(stations.value, observations.value, props.center, max)
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

const { mapReady, getMap } = useMapboxMap({
  container: mapEl,
  initialView: () => ({ center: [props.center.lon, props.center.lat], zoom: 9 }),
  scrollZoom: false,
  popupMaxWidth: '200px',
  onLoad: (map, mapboxgl, popup) => {
    map.addSource('obs-mini', { type: 'geojson', data: buildGeoJSON() })

    map.addLayer({
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

    map.addLayer({
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

    map.addLayer({
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

    map.addLayer({
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

    map.on('mouseenter', 'obs-mini-circles', (e) => {
      const feat = e.features?.[0]
      if (!feat) return
      map.getCanvas().style.cursor = 'pointer'
      const p = feat.properties!
      const coords = (feat.geometry as GeoJSON.Point).coordinates as [number, number]
      popup!
        .setLngLat(coords)
        .setDOMContent(stationPopupNode(p.stationName, p.temperature, p.color))
        .addTo(map)
    })
    map.on('mouseleave', 'obs-mini-circles', () => {
      map.getCanvas().style.cursor = ''
      popup!.remove()
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
      map.fitBounds(bounds, { padding: 50, maxZoom: 12 })
    }
  },
})

watch(
  nearestObs,
  () => {
    const map = getMap()
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
