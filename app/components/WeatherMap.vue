<script setup lang="ts">
import type { Map, GeoJSONSource, Popup } from 'mapbox-gl'
import type { MapLayer, MapFocus, FcPoint, MapPick } from '#shared/map-types'
import { buildDistrictGeoJSON } from '~/utils/districtGeoJSON'
import {
  mapboxTempColor, mapboxLevelColor, mapboxFireColor, mapboxWaveColor, mapboxUvColor, mapboxAccentColor,
  mapboxTempTextColor, mapboxUvValueColor, mapboxWarningTextColor, mapboxFireTextColor, mapboxFireHaloColor,
  mapboxTempColorStops,
} from '~/utils/mapColors'
import { CAPITALS, SEA_POINTS, iconSvg, isNowDaytime } from '~/utils/maps'
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

// Per-location forecast, fetched lazily for whichever non-capital locations are currently
// on screen (see fetchVisibleLocationForecasts) — populated progressively as the user pans/zooms
const locationForecastCache = new Map<number, { tmax: number | null; wt: number | null }>()
let forecastFetchTimer: ReturnType<typeof setTimeout> | null = null

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

// approximate per-location temperature (district capital's tmax) used only to color
// cluster bubbles by aggregate temperature — real per-location forecasts are fetched
// lazily (see locationForecastCache) and most aren't loaded while still clustered
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

// --- GeoJSON builders ---

function buildDistrictDataGeoJSON(): GeoJSON.FeatureCollection {
  const base = buildDistrictGeoJSON()
  return {
    type: 'FeatureCollection',
    features: base.features.map(feat => {
      const name = feat.properties?.name as string
      let fillColor = '#f0f0f2'
      let labelText = ''
      let labelColor = '#1e2a3a'
      let labelHalo = '#ffffff'

      if (props.layer === 'warnings') {
        const warn = districtWarnings.value[name]
        const level = warn?.level as 'green' | 'yellow' | 'orange' | 'red' | undefined
        fillColor = level ? mapboxLevelColor(level) : '#f0f0f2'
        labelText = warn?.type ?? ''
        labelColor = level ? mapboxWarningTextColor(level) : '#1e2a3a'
      } else if (props.layer === 'fire') {
        const n = props.fireData[name] ?? 0
        fillColor = n > 0 ? mapboxFireColor(n) : '#f0f0f2'
        labelText = n > 0 ? String(n) : ''
        labelColor = n > 0 ? mapboxFireTextColor(n) : '#1e2a3a'
        labelHalo = n > 0 ? mapboxFireHaloColor(n) : '#ffffff'
      } else if (props.layer === 'forecast') {
        const fc = props.forecastData.find(f => f.district === name)
        fillColor = fc?.tmax != null ? mapboxTempColor(fc.tmax) : '#f0f0f2'
      }

      return { ...feat, properties: { ...feat.properties, fillColor, labelText, labelColor, labelHalo } }
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
      properties: {
        stationID: id,
        stationName: s.name,
        temperature: temp,
        color: mapboxTempColor(temp),
        tempLabel: `${temp}°`,
        tempTextColor: mapboxTempTextColor(temp),
      },
    })
  }
  return { type: 'FeatureCollection', features }
}

function buildLocationsGeoJSON(): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: locations.value.map(loc => {
      const fc = locationForecastCache.get(loc.id)
      const hasForecast = fc != null && fc.tmax != null
      const districtName = districtMap.value.get(loc.districtID)?.name
      const clusterTemp = (districtName && districtTempByName.value[districtName] != null)
        ? districtTempByName.value[districtName]
        : nationalAvgTemp.value
      return {
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [loc.longitude, loc.latitude] },
        properties: {
          id: loc.id,
          name: loc.name,
          href: locationHref(loc.id, loc.name),
          tempLabel: hasForecast ? `${fc.tmax}°` : '',
          tempTextColor: hasForecast ? mapboxTempTextColor(fc.tmax!) : '#1e2a3a',
          iconId: hasForecast && fc.wt != null ? weatherIconId(fc.wt, isNowDaytime()) : '',
          clusterTemp,
        },
      }
    }),
  }
}

// Lazily fetch forecast data for whichever non-capital location dots are currently rendered
// on screen (not clustered), so icons/temps "stream in" as the user pans/zooms instead of
// eagerly fetching all ~300 locations up front.
function scheduleForecastFetch() {
  if (forecastFetchTimer) clearTimeout(forecastFetchTimer)
  forecastFetchTimer = setTimeout(fetchVisibleLocationForecasts, 300)
}

async function fetchVisibleLocationForecasts() {
  if (!map || props.layer !== 'forecast') return
  let features: GeoJSON.Feature[]
  try {
    features = map.queryRenderedFeatures({ layers: ['loc-points'] })
  } catch { return }

  const missingIds = [...new Set(
    features
      .map(f => f.properties?.id as number | undefined)
      .filter((id): id is number => id != null && !locationForecastCache.has(id))
  )]
  if (!missingIds.length) return

  // mark as pending immediately so a second pan/zoom before the response lands doesn't re-fetch
  for (const id of missingIds) locationForecastCache.set(id, { tmax: null, wt: null })

  try {
    const batch = await $fetch<{ id: string; tmax: number | null; wt: number | null }[]>('/api/map-forecast-batch', {
      query: { ids: missingIds.join(',') },
    })
    for (const entry of batch) {
      locationForecastCache.set(Number(entry.id), { tmax: entry.tmax, wt: entry.wt })
    }
    if (mapReady.value) {
      (map.getSource('locations') as GeoJSONSource | undefined)?.setData(buildLocationsGeoJSON())
    }
  } catch {
    // drop the pending placeholders so a later pan/zoom retries these ids instead of
    // treating the failed fetch as a permanent "no forecast" result
    for (const id of missingIds) locationForecastCache.delete(id)
  }
}

// Only feeds the UV layer now — forecast-layer markers use the unified locations
// rendering below so every point (capital or not) looks the same (see buildLocationsGeoJSON)
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
        uvLabel: fc.uv != null ? `${fc.uv}` : '',
        uvLabelColor: fc.uv != null ? mapboxUvValueColor(fc.uv) : '#1e2a3a',
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

const LAYER_GROUPS: Record<MapLayer, string[]> = {
  forecast:     ['district-fill', 'loc-clusters', 'loc-cluster-count', 'loc-points', 'loc-icons', 'loc-temp-labels', 'loc-name-labels'],
  observations: ['obs-circles', 'obs-labels', 'obs-value-labels'],
  warnings:     ['district-fill', 'district-overlay-labels'],
  fire:         ['district-fill', 'district-overlay-labels'],
  uv:           ['capitals-uv-circles', 'capitals-uv-labels', 'capitals-name-labels'],
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
  if (props.layer === 'forecast') scheduleForecastFetch()
}

// --- Weather icons (rasterized from the shared iconSvg data-URIs into Mapbox images) ---

const WEATHER_TYPES = [1, 2, 3, 4, 5, 6, 7, 9, 10, 25]
const ICON_SIZE = 64

function weatherIconId(wt: number, day: boolean): string {
  return `wt-icon-${wt}-${day ? 'd' : 'n'}`
}

function svgToImageData(svgDataUri: string, size = ICON_SIZE): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('no 2d context')); return }
      ctx.drawImage(img, 0, 0, size, size)
      resolve(ctx.getImageData(0, 0, size, size))
    }
    img.onerror = () => reject(new Error('icon failed to load'))
    img.src = svgDataUri
  })
}

async function loadWeatherIcons() {
  for (const wt of WEATHER_TYPES) {
    for (const day of [true, false]) {
      const id = weatherIconId(wt, day)
      if (map!.hasImage(id)) continue
      try {
        const data = await svgToImageData(iconSvg(wt, day))
        if (!map!.hasImage(id)) map!.addImage(id, data)
      } catch { /* ignore, marker falls back to the plain circle */ }
    }
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
    scrollZoom: true,
  })

  popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, maxWidth: '220px' })

  map.on('load', async () => {
    await loadWeatherIcons()
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
    // aggregate each cluster's (approximate) temperature so the bubble can be colored by
    // average rather than a flat neutral color — see clusterTemp in buildLocationsGeoJSON
    clusterProperties: {
      tempSum: ['+', ['get', 'clusterTemp']],
    },
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

  // District overlay text (warning type / fire risk number) — contrast-picked per level/tier.
  // No minzoom: the national view opens at zoom ~6.3, and with only ~20 districts on screen
  // there's no clutter risk from showing labels immediately.
  map!.addLayer({
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

  // Observation station circles
  map!.addLayer({
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

  // Temperature value below each station dot, text-safe temperature color + white halo
  // (matches the loc-temp-labels/sea-labels pattern — a value drawn on a colored dot at this
  // marker density either clips or is illegible, so it sits alongside instead)
  map!.addLayer({
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

  // Station name labels below the temp value, at high zoom
  map!.addLayer({
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

  // Capital name labels, stacked below the UV value (uv layer only — forecast-layer
  // capitals now render through the unified loc-icons/loc-temp-labels/loc-name-labels below)
  map!.addLayer({
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

  // Capital UV labels (uv layer) — value sits on top of the dot, contrast-picked (matches valuePlot)
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
      'text-color': ['get', 'uvLabelColor'],
      'text-halo-color': 'rgba(0,0,0,0.12)',
      'text-halo-width': 0.4,
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

  // Sea labels (wave height) — fixed dark navy above the marker, matches design (not wave-colored)
  map!.addLayer({
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

  // Location cluster bubbles — colored by the cluster's average (approximate) temperature
  // instead of a flat color, so it reads as part of the weather map rather than a generic pin
  map!.addLayer({
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

  // Individual location dots (unclustered) — the fallback appearance before a location's
  // forecast has streamed in; only shown on the forecast layer (see LAYER_GROUPS), same as
  // loc-icons/loc-clusters, so it never lingers on other map types
  map!.addLayer({
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

  // Streamed-in weather icon (forecast layer only) — every location (capital or not)
  // renders the same way once its forecast has loaded, no special-cased marker for capitals
  map!.addLayer({
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

  // Streamed-in temperature label (forecast layer only)
  map!.addLayer({
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

  // Streamed-in name label, below the temp value (forecast layer only)
  map!.addLayer({
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

function initInteractions() {
  // Re-check which non-capital locations are on screen after every pan/zoom so their
  // forecasts stream in progressively (a one-off initial call covers the first paint,
  // since 'moveend' only fires after a user-initiated pan/zoom)
  map!.on('moveend', scheduleForecastFetch)

  // Location cluster → zoom in. getClusterExpansionZoom is callback-based (not Promise-based)
  // in this mapbox-gl version — awaiting the return value directly awaits the GeoJSONSource
  // itself (a truthy non-Promise), silently producing a non-numeric "zoom" that corrupts the
  // camera transform. Also guard against a stale cluster id (a concurrent setData from
  // scheduleForecastFetch rebuilds Supercluster's id space) by falling back to a plain zoom-in
  // rather than leaving the click a no-op.
  map!.on('click', 'loc-clusters', (e) => {
    const feats = map!.queryRenderedFeatures(e.point, { layers: ['loc-clusters'] })
    if (!feats.length) return
    const clusterId = feats[0].properties!.cluster_id as number
    const coords = (feats[0].geometry as GeoJSON.Point).coordinates as [number, number]
    const src = map!.getSource('locations') as GeoJSONSource
    src.getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err || typeof zoom !== 'number' || !Number.isFinite(zoom)) {
        map!.easeTo({ center: coords, zoom: map!.getZoom() + 2 })
        return
      }
      map!.easeTo({ center: coords, zoom })
    })
  })

  // Location dot / streamed-in icon → emit pick (parent handles navigation)
  for (const layer of ['loc-points', 'loc-icons']) {
    map!.on('click', layer, (e) => {
      const feat = e.features?.[0]
      if (!feat) return
      const p = feat.properties!
      emit('pick', { kind: 'location', id: String(p.id), name: p.name as string })
    })
  }

  // Cursor pointers
  const clickable = ['loc-clusters', 'loc-points', 'loc-icons', 'obs-circles', 'sea-circles', 'capitals-uv-circles']
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

  // Capital hover popup (uv layer)
  map!.on('mouseenter', 'capitals-uv-circles', (e) => {
    const feat = e.features?.[0]
    if (!feat) return
    const p = feat.properties!
    const coords = (feat.geometry as GeoJSON.Point).coordinates as [number, number]
    popup!
      .setLngLat(coords)
      .setHTML(capitalPopupHtml(p))
      .addTo(map!)
  })
  map!.on('mouseleave', 'capitals-uv-circles', () => popup!.remove())

  // Location dot / icon hover popup
  for (const layer of ['loc-points', 'loc-icons']) {
    map!.on('mouseenter', layer, (e) => {
      const feat = e.features?.[0]
      if (!feat) return
      const p = feat.properties!
      const coords = (feat.geometry as GeoJSON.Point).coordinates as [number, number]
      const tempHtml = p.tempLabel
        ? `<span style="font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:600;color:${p.tempTextColor};margin-left:6px;">${p.tempLabel}</span>`
        : ''
      popup!
        .setLngLat(coords)
        .setHTML(`<div style="font-family:'IBM Plex Sans',sans-serif;font-size:13px;padding:5px 8px;font-weight:600;color:#1e2a3a;">${p.name}${tempHtml}</div>`)
        .addTo(map!)
    })
    map!.on('mouseleave', layer, () => popup!.remove())
  }

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
