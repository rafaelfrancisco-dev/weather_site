import type { Map } from 'mapbox-gl'
import type { MapLayer } from '#shared/map-types'
import {
  mapboxTempColorStops,
} from '~/utils/mapColors'

export const ALL_TOGGLED_LAYERS = [
  'district-fill',
  'district-overlay-labels',
  'obs-circles',
  'obs-labels',
  'obs-value-labels',
  'capitals-name-labels',
  'capitals-uv-circles',
  'capitals-uv-labels',
  'sea-circles',
  'sea-labels',
  'loc-clusters',
  'loc-cluster-count',
  'loc-points',
  'loc-icons',
  'loc-temp-labels',
  'loc-name-labels',
] as const

export const LAYER_GROUPS: Record<MapLayer, string[]> = {
  forecast: ['district-fill', 'loc-clusters', 'loc-cluster-count', 'loc-points', 'loc-icons', 'loc-temp-labels', 'loc-name-labels'],
  observations: ['obs-circles', 'obs-labels', 'obs-value-labels'],
  warnings: ['district-fill', 'district-overlay-labels'],
  fire: ['district-fill', 'district-overlay-labels'],
  uv: ['capitals-uv-circles', 'capitals-uv-labels', 'capitals-name-labels'],
  sea: ['sea-circles', 'sea-labels'],
}

export function initWeatherMapLayers(map: Map, accent: string) {
  map.addLayer({
    id: 'district-fill',
    type: 'fill',
    source: 'districts',
    paint: {
      'fill-color': ['get', 'fillColor'],
      'fill-opacity': 0.72,
    },
  })

  map.addLayer({
    id: 'district-stroke',
    type: 'line',
    source: 'districts',
    paint: {
      'line-color': '#a0a8b8',
      'line-width': 0.7,
      'line-opacity': 0.5,
    },
  })

  map.addLayer({
    id: 'district-overlay-labels',
    type: 'symbol',
    source: 'districts',
    filter: ['!=', ['get', 'labelText'], ''],
    layout: {
      'text-field': ['get', 'labelText'],
      'text-size': 11,
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Regular'],
      'text-max-width': 10,
    },
    paint: {
      'text-color': ['get', 'labelColor'],
      'text-halo-color': ['get', 'labelHalo'],
      'text-halo-width': 1.6,
    },
  })

  map.addLayer({
    id: 'obs-circles',
    type: 'circle',
    source: 'obs',
    paint: {
      'circle-color': ['get', 'color'],
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 4, 8, 6, 12, 9],
      'circle-stroke-width': 1.5,
      'circle-stroke-color': '#fff',
      'circle-opacity': 0.92,
    },
  })

  map.addLayer({
    id: 'obs-value-labels',
    type: 'symbol',
    source: 'obs',
    minzoom: 7,
    layout: {
      'text-field': ['get', 'tempLabel'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 7, 10, 12, 12],
      'text-font': ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
      'text-offset': [0, 1.2],
      'text-allow-overlap': true,
    },
    paint: {
      'text-color': ['get', 'tempTextColor'],
      'text-halo-color': '#fff',
      'text-halo-width': 1.6,
    },
  })

  map.addLayer({
    id: 'obs-labels',
    type: 'symbol',
    source: 'obs',
    minzoom: 10.5,
    layout: {
      'text-field': ['get', 'stationName'],
      'text-size': 11,
      'text-offset': [0, 2.4],
      'text-font': ['DIN Offc Pro Regular', 'Arial Unicode MS Regular'],
    },
    paint: {
      'text-color': '#3e4860',
      'text-halo-color': '#fff',
      'text-halo-width': 1.6,
    },
  })

  map.addLayer({
    id: 'capitals-name-labels',
    type: 'symbol',
    source: 'capitals',
    minzoom: 6,
    layout: {
      'text-field': ['get', 'name'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 6, 10, 10, 12],
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Regular'],
      'text-offset': [0, 2.9],
      'text-allow-overlap': false,
      'text-optional': true,
    },
    paint: {
      'text-color': '#1e2a3a',
      'text-halo-color': '#fff',
      'text-halo-width': 1.6,
    },
  })

  map.addLayer({
    id: 'capitals-uv-circles',
    type: 'circle',
    source: 'capitals',
    paint: {
      'circle-color': ['get', 'uvColor'],
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 9, 10, 14],
      'circle-stroke-width': 2,
      'circle-stroke-color': '#fff',
    },
  })

  map.addLayer({
    id: 'capitals-uv-labels',
    type: 'symbol',
    source: 'capitals',
    minzoom: 6,
    filter: ['!=', ['get', 'uvLabel'], ''],
    layout: {
      'text-field': ['get', 'uvLabel'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 6, 9, 10, 12],
      'text-font': ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
      'text-offset': [0, 0],
      'text-allow-overlap': true,
    },
    paint: {
      'text-color': ['get', 'uvLabelColor'],
      'text-halo-color': 'rgba(0,0,0,0.12)',
      'text-halo-width': 0.4,
    },
  })

  map.addLayer({
    id: 'sea-circles',
    type: 'circle',
    source: 'sea',
    paint: {
      'circle-color': ['get', 'color'],
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 11, 10, 18],
      'circle-stroke-width': 2,
      'circle-stroke-color': '#fff',
      'circle-opacity': 0.9,
    },
  })

  map.addLayer({
    id: 'sea-labels',
    type: 'symbol',
    source: 'sea',
    layout: {
      'text-field': ['get', 'label'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 5, 9, 10, 12],
      'text-font': ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
      'text-offset': [0, -1.6],
      'text-allow-overlap': true,
    },
    paint: {
      'text-color': '#1e2a3a',
      'text-halo-color': '#fff',
      'text-halo-width': 1.6,
    },
  })

  map.addLayer({
    id: 'loc-clusters',
    type: 'circle',
    source: 'locations',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': [
        'interpolate', ['linear'], ['/', ['get', 'tempSum'], ['get', 'point_count']],
        ...mapboxTempColorStops(),
      ],
      'circle-radius': ['step', ['get', 'point_count'], 14, 10, 18, 50, 24],
      'circle-stroke-width': 2,
      'circle-stroke-color': '#fff',
      'circle-opacity': 0.9,
    },
  })

  map.addLayer({
    id: 'loc-cluster-count',
    type: 'symbol',
    source: 'locations',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-size': 12,
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
    },
    paint: { 'text-color': '#fff' },
  })

  map.addLayer({
    id: 'loc-points',
    type: 'circle',
    source: 'locations',
    filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'iconId'], '']],
    paint: {
      'circle-color': accent,
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 5, 12, 8],
      'circle-stroke-width': 1.5,
      'circle-stroke-color': '#fff',
    },
  })

  map.addLayer({
    id: 'loc-icons',
    type: 'symbol',
    source: 'locations',
    filter: ['all', ['!', ['has', 'point_count']], ['!=', ['get', 'iconId'], '']],
    layout: {
      'icon-image': ['get', 'iconId'],
      'icon-size': ['interpolate', ['linear'], ['zoom'], 6, 0.38, 12, 0.5],
      'icon-allow-overlap': true,
    },
  })

  map.addLayer({
    id: 'loc-temp-labels',
    type: 'symbol',
    source: 'locations',
    filter: ['all', ['!', ['has', 'point_count']], ['!=', ['get', 'iconId'], '']],
    layout: {
      'text-field': ['get', 'tempLabel'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 6, 10, 12, 12],
      'text-font': ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
      'text-offset': [0, 1.4],
      'text-allow-overlap': true,
    },
    paint: {
      'text-color': ['get', 'tempTextColor'],
      'text-halo-color': '#fff',
      'text-halo-width': 1.6,
    },
  })

  map.addLayer({
    id: 'loc-name-labels',
    type: 'symbol',
    source: 'locations',
    filter: ['all', ['!', ['has', 'point_count']], ['!=', ['get', 'iconId'], '']],
    layout: {
      'text-field': ['get', 'name'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 6, 9, 12, 11],
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Regular'],
      'text-offset': [0, 2.6],
      'text-allow-overlap': false,
      'text-optional': true,
    },
    paint: {
      'text-color': '#1e2a3a',
      'text-halo-color': '#fff',
      'text-halo-width': 1.6,
    },
  })
}
