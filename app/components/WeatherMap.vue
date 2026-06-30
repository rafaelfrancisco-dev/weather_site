<script setup lang="ts">
import type { Map, GeoJSONSource, Popup } from 'mapbox-gl'
import type { MapLayer, MapFocus, FcPoint, MapPick } from '#shared/map-types'
import { buildDistrictGeoJSON } from '~/utils/districtGeoJSON'
import {
  mapboxTempColor, mapboxLevelColor, mapboxFireColor, mapboxWaveColor, mapboxUvColor, mapboxAccentColor,
  HEATMAP_COLOR_STOPS,
} from '~/utils/mapColors'
import { CAPITALS, SEA_POINTS } from '~/utils/maps'
import { normalizeLevel, isWarningActive } from '~/utils/transform'
import { levelRank } from '~/utils/colors'
import { locationHref } from '#shared/slug'

const props = defineProps<{
  layer: MapLayer
  focus: MapFocus | null
  height: number
  forecastData: FcPoint[]
  fireData: Record<string, number>
}>()

const emit = defineEmits<{ pick: [pick: MapPick] }>()

const settings = useSettings()
const config = useRuntimeConfig()
const { locations, stations, observations, warningsByArea, districtMap } = useLocationsData()

const mapEl = ref<HTMLDivElement | null>(null)
const mapReady = ref(false)

let map: Map | null = null
let popup: Popup | null = null

// --- district warnings computed (same logic as WeatherMapsPage) ---

const districtWarnings = computed<Record<string, { type: string; level: string }>>(() => {
  const result: Record<string, { type: string; level: string }> = {}
  const districtAreaId = new Map<number, string>()
  for (const loc of locations.value) {
    if (!districtAreaId.has(loc.districtID)) districtAreaId.set(loc.districtID, loc.warningAreaID)
  }
  const now = new Date()
  for (const [districtId, areaId] of districtAreaId) {
    const district = districtMap.value.get(districtId)
    if (!district) continue
    const active = (warningsByArea.value.get(areaId) ?? []).filter(w => {
      const level = normalizeLevel(w)
      return level !== 'green' && isWarningActive(w, now)
    })
    if (!active.length) continue
    const top = active.reduce((best, w) =>
      levelRank(normalizeLevel(w)) > levelRank(normalizeLevel(best)) ? w : best
    )
    result[district.name] = { type: top.awarenessTypeName, level: normalizeLevel(top) }
  }
  return result
})

// --- GeoJSON builders ---

function buildDistrictDataGeoJSON(): GeoJSON.FeatureCollection {
  const base = buildDistrictGeoJSON()
  return {
    type: 'FeatureCollection',
    features: base.features.map(feat => {
      const name = feat.properties?.name as string
      let fillColor = '#f0f0f2'
      let labelText = ''

      if (props.layer === 'warnings') {
        const warn = districtWarnings.value[name]
        fillColor = warn ? mapboxLevelColor(warn.level as 'green' | 'yellow' | 'orange' | 'red') : '#f0f0f2'
        labelText = warn?.type ?? ''
      } else if (props.layer === 'fire') {
        const n = props.fireData[name] ?? 0
        fillColor = n > 0 ? mapboxFireColor(n) : '#f0f0f2'
        labelText = n > 0 ? String(n) : ''
      } else if (props.layer === 'forecast') {
        const fc = props.forecastData.find(f => f.district === name)
        fillColor = fc?.tmax != null ? mapboxTempColor(fc.tmax) : '#f0f0f2'
      }

      return { ...feat, properties: { ...feat.properties, fillColor, labelText } }
    }),
  }
}

function buildObsGeoJSON(): GeoJSON.FeatureCollection {
  const stationMap = new Map(stations.value.map(s => [s.id, s]))
  const latest = new Map<number, number>()
  const sorted = [...observations.value].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  for (const obs of sorted) {
    if (!latest.has(obs.stationID) && obs.temperature != null) latest.set(obs.stationID, obs.temperature)
  }
  const features: GeoJSON.Feature[] = []
  for (const [id, temp] of latest) {
    const s = stationMap.get(id)
    if (!s) continue
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [s.longitude, s.latitude] },
      properties: { stationID: id, stationName: s.name, temperature: temp, color: mapboxTempColor(temp) },
    })
  }
  return { type: 'FeatureCollection', features }
}

function buildLocationsGeoJSON(): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: locations.value.map(loc => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [loc.longitude, loc.latitude] },
      properties: { id: loc.id, name: loc.name, href: locationHref(loc.id, loc.name) },
    })),
  }
}

function buildCapitalsGeoJSON(): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: props.forecastData.map(fc => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [fc.lon, fc.lat] },
      properties: {
        name: fc.name,
        district: fc.district,
        tmax: fc.tmax,
        tmin: fc.tmin,
        uv: fc.uv,
        tempColor: fc.tmax != null ? mapboxTempColor(fc.tmax) : '#888888',
        uvColor: fc.uv != null ? mapboxUvColor(fc.uv) : '#888888',
        tempLabel: fc.tmax != null ? `${fc.tmax}°` : '',
        uvLabel: fc.uv != null ? `${fc.uv}` : '',
      },
    })),
  }
}

function buildSeaGeoJSON(): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: SEA_POINTS.map(pt => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [pt.lon, pt.lat] },
      properties: { name: pt.name, h: pt.h, dir: pt.dir, color: mapboxWaveColor(pt.h), label: `${pt.h}m` },
    })),
  }
}

// --- Layer visibility ---

const ALL_TOGGLED_LAYERS = [
  'district-fill',
  'district-overlay-labels',
  'temp-heatmap',
  'obs-circles',
  'obs-labels',
  'capitals-temp-circles',
  'capitals-temp-labels',
  'capitals-uv-circles',
  'capitals-uv-labels',
  'sea-circles',
  'sea-labels',
] as const

const LAYER_GROUPS: Record<MapLayer, string[]> = {
  forecast:     ['district-fill', 'capitals-temp-circles', 'capitals-temp-labels'],
  observations: ['temp-heatmap', 'obs-circles', 'obs-labels'],
  warnings:     ['district-fill', 'district-overlay-labels'],
  fire:         ['district-fill', 'district-overlay-labels'],
  uv:           ['capitals-uv-circles', 'capitals-uv-labels'],
  sea:          ['sea-circles', 'sea-labels'],
}

function applyLayerVisibility() {
  if (!map) return
  const active = new Set(LAYER_GROUPS[props.layer])
  for (const id of ALL_TOGGLED_LAYERS) {
    try {
      map.setLayoutProperty(id, 'visibility', active.has(id) ? 'visible' : 'none')
    } catch { /* layer may not exist yet */ }
  }
}

// --- Initial view ---

function getInitialView(): { center: [number, number]; zoom: number } {
  const district = props.focus?.district
  const group = props.focus?.group
  if (district) {
    const cap = CAPITALS.find(c => c.district === district)
    if (cap) return { center: [cap.lon, cap.lat], zoom: 9 }
  }
  if (group === 'madeira') return { center: [-16.9, 32.65], zoom: 10 }
  if (group === 'azores') return { center: [-27.2, 38.6], zoom: 7 }
  return { center: [-8.2, 39.5], zoom: 6.3 }
}

// --- Map init ---

onMounted(async () => {
  if (!config.public.mapboxToken) return

  const mapboxgl = (await import('mapbox-gl')).default
  mapboxgl.accessToken = config.public.mapboxToken as string

  const { center, zoom } = getInitialView()

  map = new mapboxgl.Map({
    container: mapEl.value!,
    style: 'mapbox://styles/mapbox/light-v11',
    center,
    zoom,
    attributionControl: false,
    scrollZoom: false,
  })

  popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, maxWidth: '220px' })

  map.on('load', () => {
    initSources()
    initLayers()
    initInteractions()
    applyLayerVisibility()
    mapReady.value = true
  })
})

onUnmounted(() => {
  map?.remove()
  map = null
  popup = null
})

function initSources() {
  map!.addSource('districts', { type: 'geojson', data: buildDistrictDataGeoJSON() })
  map!.addSource('obs', { type: 'geojson', data: buildObsGeoJSON() })
  map!.addSource('locations', {
    type: 'geojson',
    data: buildLocationsGeoJSON(),
    cluster: true,
    clusterMaxZoom: 10,
    clusterRadius: 50,
  })
  map!.addSource('capitals', { type: 'geojson', data: buildCapitalsGeoJSON() })
  map!.addSource('sea', { type: 'geojson', data: buildSeaGeoJSON() })
}

function initLayers() {
  const accent = mapboxAccentColor(settings.value.accent)

  // District fills (choropleth)
  map!.addLayer({
    id: 'district-fill',
    type: 'fill',
    source: 'districts',
    paint: {
      'fill-color': ['get', 'fillColor'],
      'fill-opacity': 0.72,
    },
  })

  // District outlines — always visible for geographic reference
  map!.addLayer({
    id: 'district-stroke',
    type: 'line',
    source: 'districts',
    paint: {
      'line-color': '#a0a8b8',
      'line-width': 0.7,
      'line-opacity': 0.5,
    },
  })

  // District overlay text (warning type / fire risk number)
  map!.addLayer({
    id: 'district-overlay-labels',
    type: 'symbol',
    source: 'districts',
    minzoom: 7,
    filter: ['!=', ['get', 'labelText'], ''],
    layout: {
      'text-field': ['get', 'labelText'],
      'text-size': 11,
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Regular'],
      'text-max-width': 10,
    },
    paint: {
      'text-color': '#1e2a3a',
      'text-halo-color': 'rgba(255,255,255,0.85)',
      'text-halo-width': 1.5,
    },
  })

  // Temperature heatmap (observations layer)
  map!.addLayer({
    id: 'temp-heatmap',
    type: 'heatmap',
    source: 'obs',
    paint: {
      'heatmap-weight': ['interpolate', ['linear'], ['get', 'temperature'], -5, 0, 10, 0.35, 25, 0.65, 40, 1],
      'heatmap-intensity': 1.1,
      'heatmap-color': [
        'interpolate', ['linear'], ['heatmap-density'],
        ...HEATMAP_COLOR_STOPS.flatMap(([stop, color]) => [stop, color]),
      ],
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 5, 30, 9, 50],
      'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0.85, 10, 0],
    },
  })

  // Observation station circles (appear when heatmap fades)
  map!.addLayer({
    id: 'obs-circles',
    type: 'circle',
    source: 'obs',
    minzoom: 8,
    paint: {
      'circle-color': ['get', 'color'],
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 5, 12, 9],
      'circle-stroke-width': 1.5,
      'circle-stroke-color': '#fff',
      'circle-opacity': 0.92,
    },
  })

  // Station name labels at high zoom
  map!.addLayer({
    id: 'obs-labels',
    type: 'symbol',
    source: 'obs',
    minzoom: 10.5,
    layout: {
      'text-field': ['get', 'stationName'],
      'text-size': 11,
      'text-offset': [0, 1.3],
      'text-font': ['DIN Offc Pro Regular', 'Arial Unicode MS Regular'],
    },
    paint: {
      'text-color': '#3e4860',
      'text-halo-color': '#fff',
      'text-halo-width': 1,
    },
  })

  // Capital circles — temperature color (forecast layer)
  map!.addLayer({
    id: 'capitals-temp-circles',
    type: 'circle',
    source: 'capitals',
    paint: {
      'circle-color': ['get', 'tempColor'],
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 9, 10, 14],
      'circle-stroke-width': 2,
      'circle-stroke-color': '#fff',
    },
  })

  // Capital temperature labels (forecast layer)
  map!.addLayer({
    id: 'capitals-temp-labels',
    type: 'symbol',
    source: 'capitals',
    minzoom: 6,
    filter: ['!=', ['get', 'tempLabel'], ''],
    layout: {
      'text-field': ['get', 'tempLabel'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 6, 9, 10, 12],
      'text-font': ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
      'text-offset': [0, 0],
      'text-allow-overlap': true,
    },
    paint: {
      'text-color': '#fff',
      'text-halo-color': 'rgba(0,0,0,0.15)',
      'text-halo-width': 0.5,
    },
  })

  // Capital circles — UV color (uv layer)
  map!.addLayer({
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

  // Capital UV labels (uv layer)
  map!.addLayer({
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
      'text-color': '#fff',
      'text-halo-color': 'rgba(0,0,0,0.15)',
      'text-halo-width': 0.5,
    },
  })

  // Sea point circles (sea layer)
  map!.addLayer({
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

  // Sea labels (wave height)
  map!.addLayer({
    id: 'sea-labels',
    type: 'symbol',
    source: 'sea',
    layout: {
      'text-field': ['get', 'label'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 5, 9, 10, 12],
      'text-font': ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
      'text-offset': [0, 0],
      'text-allow-overlap': true,
    },
    paint: {
      'text-color': '#fff',
      'text-halo-color': 'rgba(0,0,0,0.1)',
      'text-halo-width': 0.5,
    },
  })

  // Location cluster bubbles
  map!.addLayer({
    id: 'loc-clusters',
    type: 'circle',
    source: 'locations',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': '#6b7280',
      'circle-radius': ['step', ['get', 'point_count'], 14, 10, 18, 50, 24],
      'circle-stroke-width': 2,
      'circle-stroke-color': '#fff',
      'circle-opacity': 0.88,
    },
  })

  // Cluster count labels
  map!.addLayer({
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

  // Individual location dots (unclustered)
  map!.addLayer({
    id: 'loc-points',
    type: 'circle',
    source: 'locations',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': accent,
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 5, 12, 8],
      'circle-stroke-width': 1.5,
      'circle-stroke-color': '#fff',
    },
  })
}

function initInteractions() {
  // District click → emit pick
  map!.on('click', 'district-fill', (e) => {
    const feat = e.features?.[0]
    if (!feat) return
    const name = feat.properties?.name as string
    emit('pick', { kind: 'district', id: name, name })
  })

  // Location cluster → zoom in
  map!.on('click', 'loc-clusters', async (e) => {
    const feats = map!.queryRenderedFeatures(e.point, { layers: ['loc-clusters'] })
    if (!feats.length) return
    const clusterId = feats[0].properties!.cluster_id as number
    const src = map!.getSource('locations') as GeoJSONSource
    try {
      const zoom = await src.getClusterExpansionZoom(clusterId)
      const coords = (feats[0].geometry as GeoJSON.Point).coordinates as [number, number]
      map!.easeTo({ center: coords, zoom })
    } catch { /* ignore */ }
  })

  // Location dot → emit pick (parent handles navigation)
  map!.on('click', 'loc-points', (e) => {
    const feat = e.features?.[0]
    if (!feat) return
    const p = feat.properties!
    emit('pick', { kind: 'location', id: String(p.id), name: p.name as string })
  })

  // Cursor pointers
  const clickable = ['district-fill', 'loc-clusters', 'loc-points', 'obs-circles', 'sea-circles', 'capitals-temp-circles', 'capitals-uv-circles']
  for (const layer of clickable) {
    map!.on('mouseenter', layer, () => { map!.getCanvas().style.cursor = 'pointer' })
    map!.on('mouseleave', layer, () => { map!.getCanvas().style.cursor = '' })
  }

  // Obs hover popup
  map!.on('mouseenter', 'obs-circles', (e) => {
    const feat = e.features?.[0]
    if (!feat) return
    const p = feat.properties!
    const coords = (feat.geometry as GeoJSON.Point).coordinates as [number, number]
    popup!
      .setLngLat(coords)
      .setHTML(stationPopupHtml(p.stationName, p.temperature, p.color))
      .addTo(map!)
  })
  map!.on('mouseleave', 'obs-circles', () => popup!.remove())

  // Capital hover popup (temp and uv layers share the same source)
  for (const layer of ['capitals-temp-circles', 'capitals-uv-circles']) {
    map!.on('mouseenter', layer, (e) => {
      const feat = e.features?.[0]
      if (!feat) return
      const p = feat.properties!
      const coords = (feat.geometry as GeoJSON.Point).coordinates as [number, number]
      popup!
        .setLngLat(coords)
        .setHTML(capitalPopupHtml(p))
        .addTo(map!)
    })
    map!.on('mouseleave', layer, () => popup!.remove())
  }

  // Location dot hover popup
  map!.on('mouseenter', 'loc-points', (e) => {
    const feat = e.features?.[0]
    if (!feat) return
    const coords = (feat.geometry as GeoJSON.Point).coordinates as [number, number]
    popup!
      .setLngLat(coords)
      .setHTML(`<div style="font-family:'IBM Plex Sans',sans-serif;font-size:13px;padding:5px 8px;font-weight:600;color:#1e2a3a;">${feat.properties!.name}</div>`)
      .addTo(map!)
  })
  map!.on('mouseleave', 'loc-points', () => popup!.remove())

  // Sea hover popup
  map!.on('mouseenter', 'sea-circles', (e) => {
    const feat = e.features?.[0]
    if (!feat) return
    const p = feat.properties!
    const coords = (feat.geometry as GeoJSON.Point).coordinates as [number, number]
    popup!
      .setLngLat(coords)
      .setHTML(seaPopupHtml(p))
      .addTo(map!)
  })
  map!.on('mouseleave', 'sea-circles', () => popup!.remove())
}

// --- Popup HTML helpers ---

function stationPopupHtml(name: string, temp: number | null, color: string) {
  const tempHtml = temp != null
    ? `<div style="font-family:'IBM Plex Mono',monospace;font-size:16px;font-weight:600;color:${color};margin-top:2px;">${temp}°</div>`
    : ''
  return `<div style="font-family:'IBM Plex Sans',sans-serif;padding:6px 10px;">
    <div style="font-size:12px;font-weight:600;color:#1e2a3a;">${name}</div>
    ${tempHtml}
  </div>`
}

function capitalPopupHtml(p: Record<string, unknown>) {
  const tmax = p.tmax as number | null
  const tmin = p.tmin as number | null
  const uv = p.uv as number | null
  const color = p.tempColor as string
  return `<div style="font-family:'IBM Plex Sans',sans-serif;padding:6px 10px;">
    <div style="font-size:12px;font-weight:700;color:#1e2a3a;margin-bottom:3px;">${p.name}</div>
    ${tmax != null ? `<span style="font-family:'IBM Plex Mono',monospace;font-size:15px;font-weight:600;color:${color};">${tmax}°</span>` : ''}
    ${tmin != null ? `<span style="font-family:'IBM Plex Mono',monospace;font-size:12px;color:#5a6a7a;margin-left:4px;">/ ${tmin}°</span>` : ''}
    ${uv != null ? `<div style="font-size:11px;color:#5a6a7a;margin-top:2px;">UV ${uv}</div>` : ''}
  </div>`
}

function seaPopupHtml(p: Record<string, unknown>) {
  return `<div style="font-family:'IBM Plex Sans',sans-serif;padding:6px 10px;">
    <div style="font-size:12px;font-weight:700;color:#1e2a3a;margin-bottom:2px;">${p.name}</div>
    <div style="font-family:'IBM Plex Mono',monospace;font-size:14px;font-weight:600;color:${p.color};">${p.h}m</div>
    <div style="font-size:11px;color:#5a6a7a;">${p.dir} · ${p.period}s</div>
  </div>`
}

// --- Reactive updates ---

watch(
  [() => props.layer, () => props.forecastData, districtWarnings],
  () => {
    if (!mapReady.value || !map) return
    ;(map.getSource('districts') as GeoJSONSource | undefined)?.setData(buildDistrictDataGeoJSON())
    applyLayerVisibility()
  },
  { deep: false },
)

watch(
  [stations, observations],
  () => {
    if (!mapReady.value || !map) return
    ;(map.getSource('obs') as GeoJSONSource | undefined)?.setData(buildObsGeoJSON())
  },
  { deep: false },
)

watch(
  locations,
  () => {
    if (!mapReady.value || !map) return
    ;(map.getSource('locations') as GeoJSONSource | undefined)?.setData(buildLocationsGeoJSON())
  },
  { deep: false },
)

watch(
  () => props.forecastData,
  () => {
    if (!mapReady.value || !map) return
    ;(map.getSource('capitals') as GeoJSONSource | undefined)?.setData(buildCapitalsGeoJSON())
  },
  { deep: false },
)

watch(
  () => props.focus,
  (newFocus) => {
    if (!mapReady.value || !map) return
    const district = newFocus?.district
    const group = newFocus?.group
    if (district) {
      const cap = CAPITALS.find(c => c.district === district)
      if (cap) { map!.flyTo({ center: [cap.lon, cap.lat], zoom: 9, duration: 600 }); return }
    }
    if (group === 'madeira') { map!.flyTo({ center: [-16.9, 32.65], zoom: 10, duration: 600 }); return }
    if (group === 'azores') { map!.flyTo({ center: [-27.2, 38.6], zoom: 7, duration: 600 }); return }
    map!.flyTo({ center: [-8.2, 39.5], zoom: 6.3, duration: 600 })
  },
)

const noToken = computed(() => !config.public.mapboxToken)
</script>

<template>
  <div :style="{ position: 'relative', width: '100%', height: `${props.height}px` }">
    <div ref="mapEl" style="position:absolute;inset:0;border-radius:inherit;" />

    <div
      v-if="noToken"
      style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:oklch(0.975 0.004 250);font-size:13px;color:oklch(0.5 0.01 255);text-align:center;padding:24px;border-radius:inherit;"
    >
      Set <code>NUXT_PUBLIC_MAPBOX_TOKEN</code> to enable the map.
    </div>

    <div
      v-else-if="!mapReady"
      style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:oklch(0.975 0.004 250);font-size:13px;color:oklch(0.5 0.01 255);border-radius:inherit;"
    >
      Loading map…
    </div>
  </div>
</template>
