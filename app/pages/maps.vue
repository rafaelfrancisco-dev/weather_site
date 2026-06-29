<script setup lang="ts">
import { locationHref } from '#shared/slug'
import type { FcPoint, MapFocus, MapGroup, MapLayer, MapPick, ObsPoint, WarnEntry } from '#shared/map-types'
import { strings } from '~/utils/i18n'
import { accentColors, fireColor, levelColor, levelRank, tempFill, uvColor, waveFill } from '~/utils/colors'
import type { WarningLevel } from '~/utils/colors'
import { dateTimeLabel } from '~/utils/format'
import { isWarningActive, normalizeLevel, regionLabel } from '~/utils/transform'
import { FIRE, SEA_POINTS, geoGroup } from '~/utils/maps'
import { PT_GEO } from '~/utils/portugal-geo-data'

interface LayerDef {
  id: MapLayer
  label: string
  swatchColor: string
  unit: string
  hint: string
  legendTitle: string
  legendStops: { label: string; color: string }[]
}

interface WarningSummary {
  name: string
  type: string
  level: WarningLevel
  color: string
  soft: string
  group: MapGroup
}

const settings = useSettings()
const { mobile } = useViewport()
const router = useRouter()

const lang = computed(() => settings.value.lang)
const t = computed(() => strings(lang.value))
const c = computed(() => accentColors(settings.value.accent))

const activeLayer = ref<MapLayer>('forecast')
const selectedPick = ref<MapPick | null>(null)
const focus = ref<MapFocus | null>(null)

const {
  locations,
  stations,
  observations,
  warningsByArea,
  districtMap,
  bootstrapped,
} = useLocationsData()

const { data: rawForecast, pending: fcPending } = useFetch<FcPoint[]>('/api/map-forecast')
const forecastData = computed<FcPoint[]>(() => rawForecast.value ?? [])

const latestTempByStation = computed(() => {
  const map = new Map<number, number>()
  const sorted = [...observations.value].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  for (const obs of sorted) {
    if (!map.has(obs.stationID) && obs.temperature != null) map.set(obs.stationID, obs.temperature)
  }
  return map
})

const obsPoints = computed<ObsPoint[]>(() =>
  stations.value
    .filter(station => latestTempByStation.value.has(station.id))
    .map(station => ({
      id: station.id,
      name: station.name,
      group: geoGroup(station.latitude, station.longitude),
      lat: station.latitude,
      lon: station.longitude,
      temp: latestTempByStation.value.get(station.id) ?? null,
    }))
)

const districtWarnings = computed<Record<string, WarnEntry>>(() => {
  const result: Record<string, WarnEntry> = {}
  const districtAreaId = new Map<number, string>()
  for (const loc of locations.value) {
    if (!districtAreaId.has(loc.districtID)) districtAreaId.set(loc.districtID, loc.warningAreaID)
  }

  for (const [districtId, areaId] of districtAreaId) {
    const district = districtMap.value.get(districtId)
    if (!district) continue

    const active = (warningsByArea.value.get(areaId) ?? []).filter(w => isWarningActive(w))
    let topLevel: WarningLevel = 'green'
    let topRank = 0
    let topType = ''
    for (const warning of active) {
      const level = normalizeLevel(warning)
      const rank = levelRank(level)
      if (rank > topRank) {
        topRank = rank
        topLevel = level
        topType = warning.awarenessTypeName
      }
    }
    if (topRank > 1) result[district.name] = { type: topType, level: topLevel }
  }
  return result
})

const layerDefs = computed<LayerDef[]>(() => [
  {
    id: 'forecast',
    label: t.value.forecast,
    swatchColor: 'oklch(0.78 0.14 62)',
    unit: '°C',
    hint: lang.value === 'pt' ? 'Máximas de hoje nas capitais de distrito.' : "Today's district-capital highs.",
    legendTitle: lang.value === 'pt' ? 'Temperatura °C' : 'Temperature °C',
    legendStops: [4, 9, 13, 17, 21, 25, 29, 33, 37].map(value => ({ label: String(value), color: tempFill(value) })),
  },
  {
    id: 'observations',
    label: t.value.obs,
    swatchColor: 'oklch(0.55 0.13 235)',
    unit: '°C',
    hint: lang.value === 'pt' ? 'Últimas temperaturas de estações automáticas.' : 'Latest automatic-station temperatures.',
    legendTitle: lang.value === 'pt' ? 'Temperatura °C' : 'Temperature °C',
    legendStops: [4, 9, 13, 17, 21, 25, 29, 33, 37].map(value => ({ label: String(value), color: tempFill(value) })),
  },
  {
    id: 'warnings',
    label: t.value.warnings,
    swatchColor: 'oklch(0.70 0.16 58)',
    unit: '',
    hint: lang.value === 'pt' ? 'Distritos com avisos ativos.' : 'Districts with active warnings.',
    legendTitle: lang.value === 'pt' ? 'Nível de aviso' : 'Awareness level',
    legendStops: [
      { label: lang.value === 'pt' ? 'Verde' : 'Green', color: levelColor('green') },
      { label: lang.value === 'pt' ? 'Amarelo' : 'Yellow', color: levelColor('yellow') },
      { label: lang.value === 'pt' ? 'Laranja' : 'Orange', color: levelColor('orange') },
      { label: lang.value === 'pt' ? 'Vermelho' : 'Red', color: levelColor('red') },
    ],
  },
  {
    id: 'fire',
    label: t.value.mapFire,
    swatchColor: 'oklch(0.57 0.20 30)',
    unit: '1-5',
    hint: lang.value === 'pt' ? 'Risco diário por distrito.' : 'Daily district fire risk.',
    legendTitle: lang.value === 'pt' ? 'Risco de incêndio' : 'Fire risk',
    legendStops: [
      { label: '1', color: fireColor(1) },
      { label: '2', color: fireColor(2) },
      { label: '3', color: fireColor(3) },
      { label: '4', color: fireColor(4) },
      { label: '5', color: fireColor(5) },
    ],
  },
  {
    id: 'uv',
    label: t.value.mapUv,
    swatchColor: 'oklch(0.55 0.18 320)',
    unit: 'UV',
    hint: lang.value === 'pt' ? 'Índice UV máximo previsto.' : 'Forecast maximum UV index.',
    legendTitle: t.value.mapUv,
    legendStops: [
      { label: 'Low', color: uvColor(2) },
      { label: 'Moderate', color: uvColor(4) },
      { label: 'High', color: uvColor(7) },
      { label: 'Very high', color: uvColor(9) },
      { label: 'Extreme', color: uvColor(11) },
    ],
  },
  {
    id: 'sea',
    label: t.value.mapSea,
    swatchColor: 'oklch(0.52 0.14 252)',
    unit: 'm',
    hint: lang.value === 'pt' ? 'Altura significativa da ondulação.' : 'Significant wave height.',
    legendTitle: lang.value === 'pt' ? 'Altura de onda' : 'Wave height',
    legendStops: [
      { label: '1m', color: waveFill(1) },
      { label: '2m', color: waveFill(2) },
      { label: '3m', color: waveFill(3) },
      { label: '4m', color: waveFill(4) },
      { label: '5m', color: waveFill(5) },
    ],
  },
])

const activeLayerDef = computed(() => layerDefs.value.find(def => def.id === activeLayer.value) ?? layerDefs.value[0])
const otherLayers = computed(() => layerDefs.value.filter(def => def.id !== activeLayer.value))

const latestObservation = computed(() => {
  const latest = observations.value.reduce<string | null>((max, obs) => {
    if (!max || new Date(obs.time).getTime() > new Date(max).getTime()) return obs.time
    return max
  }, null)
  return latest ? dateTimeLabel(new Date(latest), lang.value) : dateTimeLabel(new Date(), lang.value)
})

const warningsSummary = computed<WarningSummary[]>(() =>
  Object.entries(districtWarnings.value)
    .map(([name, warning]) => {
      const geoDistrict = PT_GEO.districts.find(d => d.name === name)
      const level = warning.level as WarningLevel
      return {
        name,
        type: warning.type,
        level,
        color: levelColor(level),
        soft: `color-mix(in srgb, ${levelColor(level)} 13%, white)`,
        group: (geoDistrict?.group as MapGroup | undefined) ?? 'mainland',
      }
    })
    .sort((a, b) => levelRank(b.level) - levelRank(a.level) || a.name.localeCompare(b.name))
)

const primaryHeight = computed(() => mobile.value ? 430 : 560)
const miniHeight = computed(() => mobile.value ? 152 : 168)
const focusHeight = computed(() => mobile.value ? 440 : 560)

const focusedDistrictLabel = computed(() => focus.value?.district ?? groupLabel(focus.value?.group ?? 'mainland'))

const focusedLocations = computed(() => {
  if (!focus.value) return []
  return locations.value
    .filter((loc) => {
      if (focus.value?.group === 'mainland') {
        const district = districtMap.value.get(loc.districtID)
        return district?.name === focus.value.district
      }
      return loc.regionID === (focus.value.group === 'madeira' ? 2 : 3)
    })
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
})

function groupLabel(group: MapGroup): string {
  if (group === 'madeira') return 'Madeira'
  if (group === 'azores') return lang.value === 'pt' ? 'Açores' : 'Azores'
  return lang.value === 'pt' ? 'Continente' : 'Mainland'
}

function setLayer(nextLayer: MapLayer) {
  activeLayer.value = nextLayer
  selectedPick.value = null
}

function openDistrict(name: string, group?: MapGroup) {
  const geoDistrict = PT_GEO.districts.find(d => d.name === name)
  focus.value = { group: group ?? (geoDistrict?.group as MapGroup | undefined) ?? 'mainland', district: name }
  selectedPick.value = null
}

function handlePick(pick: MapPick) {
  selectedPick.value = pick
  if (pick.kind === 'district') {
    openDistrict(pick.name)
    return
  }
  if (pick.kind === 'location' && (activeLayer.value === 'forecast' || activeLayer.value === 'uv')) {
    const id = Number(pick.id)
    if (Number.isFinite(id)) router.push(locationHref(id, pick.name))
  }
}

function locationRegion(loc: { regionID: number; districtID: number }) {
  if (loc.regionID === 1) return districtMap.value.get(loc.districtID)?.name ?? regionLabel(loc.regionID, lang.value)
  return regionLabel(loc.regionID, lang.value)
}

function locationForecast(loc: { id: number; name: string }) {
  return forecastData.value.find(point => point.id === String(loc.id) || point.name === loc.name)
}

function legendTextColor(index: number) {
  if (activeLayer.value === 'warnings' && index === 1) return 'oklch(0.3 0.05 90)'
  if (activeLayer.value === 'forecast' || activeLayer.value === 'observations') {
    const value = Number(activeLayerDef.value.legendStops[index]?.label)
    return value >= 29 || value <= 9 ? '#fff' : 'oklch(0.25 0.02 255)'
  }
  return index >= activeLayerDef.value.legendStops.length - 2 ? '#fff' : 'oklch(0.25 0.03 60)'
}

useSeoMeta({ title: 'Weather maps - MET·PT' })
</script>

<template>
  <div v-if="!bootstrapped" class="maps-loading">
    Loading...
  </div>

  <div v-else class="maps-page">
    <header class="maps-hero">
      <div>
        <p class="maps-eyebrow">
          {{ lang === 'pt' ? 'Visão nacional' : 'National overview' }}
        </p>
        <h1>{{ t.maps }}</h1>
      </div>
      <div class="maps-updated">
        <span>{{ t.updated }}</span>
        <strong>{{ latestObservation }}</strong>
      </div>
    </header>

    <nav class="layer-tabs" aria-label="Weather map layers">
      <button
        v-for="def in layerDefs"
        :key="def.id"
        class="layer-tab"
        :class="{ 'layer-tab--active': activeLayer === def.id }"
        :style="{ '--tab-accent': c.primary, '--tab-soft': c.soft }"
        type="button"
        @click="setLayer(def.id)"
      >
        <span class="layer-tab__swatch" :style="{ background: def.swatchColor }"></span>
        {{ def.label }}
      </button>
    </nav>

    <section v-if="!focus" class="atlas-grid">
      <article class="primary-map-panel">
        <div class="panel-heading">
          <h2>{{ activeLayerDef.label }}</h2>
          <p>{{ t.mapTapHint }}</p>
        </div>

        <div class="map-frame map-frame--national">
          <PTMap
            :layer="activeLayer"
            variant="full"
            :focus="null"
            :height="primaryHeight"
            :lang="lang"
            :accent="c.primary"
            :forecast-data="forecastData"
            :observation-data="obsPoints"
            :warning-data="districtWarnings"
            :fire-data="FIRE"
            @pick="handlePick"
          />
          <div v-if="fcPending && (activeLayer === 'forecast' || activeLayer === 'uv')" class="map-loading">
            Loading forecast...
          </div>

          <div class="legend">
            <div class="legend__title">{{ activeLayerDef.legendTitle }}</div>
            <div class="legend__bar">
              <span
                v-for="(stop, index) in activeLayerDef.legendStops"
                :key="stop.label"
                :style="{ background: stop.color, color: legendTextColor(index) }"
              >{{ stop.label }}</span>
            </div>
          </div>
        </div>
      </article>

      <aside class="maps-side">
        <section class="other-layers">
          <h2>{{ t.mapOtherLayers }}</h2>
          <div class="mini-grid">
            <button
              v-for="def in otherLayers"
              :key="def.id"
              class="mini-card"
              type="button"
              @click="setLayer(def.id)"
            >
              <div class="mini-card__head">
                <span class="mini-card__label">
                  <span :style="{ background: def.swatchColor }"></span>
                  {{ def.label }}
                </span>
                <span class="mini-card__unit">{{ def.unit }}</span>
              </div>
              <div class="mini-card__body">
                <PTMap
                  :layer="def.id"
                  variant="mini"
                  :focus="null"
                  :height="miniHeight"
                  :lang="lang"
                  :accent="c.primary"
                  :forecast-data="forecastData"
                  :observation-data="obsPoints"
                  :warning-data="districtWarnings"
                  :fire-data="FIRE"
                  @pick="setLayer(def.id)"
                />
              </div>
            </button>
          </div>
        </section>

        <section class="warnings-panel">
          <h2>{{ t.mapActiveWarnings }}</h2>
          <div v-if="warningsSummary.length" class="warnings-list">
            <button
              v-for="warning in warningsSummary.slice(0, 6)"
              :key="warning.name"
              class="warning-row"
              type="button"
              @click="openDistrict(warning.name, warning.group)"
            >
              <span class="warning-row__dot" :style="{ background: warning.color }"></span>
              <span class="warning-row__area">
                <strong>{{ warning.name }}</strong>
              </span>
              <small>{{ warning.type }}</small>
              <span class="warning-row__arrow">›</span>
            </button>
          </div>
          <p v-else class="empty-copy">
            {{ t.noWarn }}
          </p>
        </section>
      </aside>
    </section>

    <section v-else class="district-view">
      <button class="back-button" type="button" @click="focus = null">
        <span>‹</span>
        {{ lang === 'pt' ? 'Voltar ao mapa nacional' : 'Back to national map' }}
      </button>

      <header class="district-header">
        <div>
          <p class="maps-eyebrow">{{ groupLabel(focus.group) }}</p>
          <h1>{{ focusedDistrictLabel }}</h1>
        </div>
        <p>{{ focusedLocations.length }} {{ lang === 'pt' ? 'locais' : 'locations' }}</p>
      </header>

      <div class="district-grid">
        <article class="district-map-panel">
          <p>{{ t.mapTapHint }}</p>
          <div class="map-frame map-frame--focus">
            <PTMap
              :layer="activeLayer"
              variant="full"
              :focus="focus"
              :height="focusHeight"
              :lang="lang"
              :accent="c.primary"
              :forecast-data="forecastData"
              :observation-data="obsPoints"
              :warning-data="districtWarnings"
              :fire-data="FIRE"
              @pick="handlePick"
            />
          </div>
        </article>

        <aside class="location-panel">
          <div class="side-section__header">
            <h2>{{ lang === 'pt' ? 'Locais' : 'Locations' }}</h2>
          </div>
          <div class="location-list">
            <NuxtLink
              v-for="loc in focusedLocations"
              :key="loc.id"
              :to="locationHref(loc.id, loc.name)"
              class="location-row"
            >
              <span class="location-row__icon">⌁</span>
              <span>
                <strong>{{ loc.name }}</strong>
                <small>{{ locationRegion(loc) }}</small>
              </span>
              <span class="location-row__temp">
                <template v-if="locationForecast(loc)">
                  <strong>{{ locationForecast(loc)?.tmax ?? '—' }}°</strong>
                  <em>/</em>
                  <small>{{ locationForecast(loc)?.tmin ?? '—' }}°</small>
                </template>
              </span>
              <span class="location-row__arrow">›</span>
            </NuxtLink>
          </div>
        </aside>
      </div>
    </section>
  </div>
</template>

<style scoped>
.maps-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: oklch(0.4 0.012 255);
  font-size: 14px;
}

.maps-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 1180px;
  color: oklch(0.25 0.012 255);
}

.maps-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
}

.maps-eyebrow {
  margin: 0 0 2px;
  color: oklch(0.55 0.01 255);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.02em;
  line-height: 1.2;
}

.maps-hero h1 {
  margin: 0;
  color: oklch(0.22 0.014 255);
  font-size: 27px;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.08;
}

.maps-updated {
  display: grid;
  gap: 3px;
  text-align: right;
}

.maps-updated span,
.maps-updated strong {
  font-family: "IBM Plex Mono", monospace;
  font-size: 11px;
}

.maps-updated span {
  color: oklch(0.5 0.01 255);
  font-weight: 400;
  text-transform: none;
}

.maps-updated strong {
  color: oklch(0.28 0.012 255);
  font-weight: 600;
}

.layer-tabs {
  display: flex;
  gap: 2px;
  overflow-x: auto;
  border-bottom: 1px solid oklch(0.88 0.008 255);
}

.layer-tab {
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
  border: 0;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  padding: 9px 13px;
  background: transparent;
  color: oklch(0.48 0.01 255);
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}

.layer-tab--active {
  border-bottom-color: var(--tab-accent);
  color: var(--tab-accent);
  font-weight: 700;
}

.layer-tab__swatch {
  flex: none;
  width: 10px;
  height: 10px;
  border-radius: 3px;
}

.atlas-grid,
.district-grid {
  display: grid;
  grid-template-columns: minmax(480px, 2fr) minmax(300px, 1fr);
  gap: 18px;
  align-items: start;
}

.primary-map-panel,
.district-map-panel {
  min-width: 0;
}

.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 9px;
}

.panel-heading h2,
.other-layers h2,
.side-section__header h2 {
  margin: 0;
  color: oklch(0.30 0.012 255);
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.2;
}

.panel-heading p,
.district-map-panel > p {
  margin: 0;
  color: oklch(0.55 0.01 255);
  font-size: 11.5px;
  line-height: 1.35;
}

.map-frame {
  position: relative;
  display: flex;
  justify-content: center;
  border: 1px solid oklch(0.89 0.008 255);
  border-radius: 10px;
  background: #fff;
  min-height: 360px;
  padding: 14px;
  overflow: hidden;
}

.map-frame--focus {
  min-height: 300px;
  align-items: center;
}

.map-loading {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 6px;
  padding: 7px 12px;
  background: rgba(255, 255, 255, 0.88);
  color: oklch(0.45 0.01 255);
  font-size: 12px;
  box-shadow: 0 8px 24px rgba(35, 44, 60, 0.08);
}

.legend {
  position: absolute;
  left: 28px;
  bottom: 24px;
  width: min(440px, calc(100% - 56px));
  margin-top: 14px;
}

.legend__title {
  margin-bottom: 6px;
  color: oklch(0.55 0.01 255);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.legend__bar {
  display: flex;
  align-items: stretch;
  height: 24px;
  border: 1px solid oklch(0.9 0.006 255);
  overflow: hidden;
  border-radius: 4px;
}

.legend__bar span {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  font-family: "IBM Plex Mono", monospace;
  font-size: 9.5px;
  line-height: 1;
}

.maps-side {
  display: grid;
  gap: 16px;
}

.other-layers h2 {
  margin-bottom: 9px;
}

.warnings-panel,
.location-panel {
  border: 1px solid oklch(0.89 0.008 255);
  border-radius: 10px;
  background: #fff;
  overflow: hidden;
}

.warnings-panel h2 {
  margin: 0;
  border-bottom: 1px solid oklch(0.93 0.006 255);
  padding: 10px 13px;
  color: oklch(0.5 0.01 255);
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.side-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 9px;
  padding: 0 0 0;
}

.side-section__header span {
  min-width: 24px;
  border-radius: 999px;
  padding: 3px 7px;
  background: oklch(0.95 0.012 255);
  color: oklch(0.42 0.012 255);
  font-size: 11px;
  font-weight: 700;
  text-align: center;
}

.mini-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 11px;
}

.mini-card {
  border: 1px solid oklch(0.90 0.006 255);
  border-radius: 9px;
  padding: 0;
  background: #fff;
  color: inherit;
  cursor: pointer;
  font: inherit;
  overflow: hidden;
  text-align: left;
}

.mini-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  border-bottom: 1px solid oklch(0.93 0.006 255);
  padding: 7px 10px;
}

.mini-card__label {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  color: oklch(0.3 0.012 255);
  font-size: 11.5px;
  font-weight: 600;
  white-space: nowrap;
}

.mini-card__unit {
  flex: none;
  color: oklch(0.58 0.01 255);
  font-family: "IBM Plex Mono", monospace;
  font-size: 9px;
}

.mini-card__body {
  display: flex;
  justify-content: center;
  padding: 8px;
  background: oklch(0.99 0.002 255);
}

.mini-card__label span {
  flex: none;
  width: 9px;
  height: 9px;
  border-radius: 3px;
}

.warnings-list,
.location-list {
  display: grid;
  gap: 0;
}

.warning-row,
.location-row {
  display: flex;
  align-items: center;
  width: 100%;
  border: 0;
  border-bottom: 1px solid oklch(0.95 0.005 255);
  border-radius: 0;
  padding: 9px 13px;
  background: #fff;
  color: inherit;
  cursor: pointer;
  font: inherit;
  text-align: left;
  text-decoration: none;
}

.warning-row {
  gap: 9px;
}

.warning-row__dot {
  flex: none;
  width: 9px;
  height: 9px;
  border-radius: 3px;
}

.warning-row__area,
.location-row span:nth-child(2) {
  display: grid;
  flex: 1;
  min-width: 0;
  gap: 2px;
}

.warning-row strong,
.location-row strong {
  overflow: hidden;
  color: oklch(0.28 0.012 255);
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.warning-row small,
.location-row small,
.empty-copy {
  color: oklch(0.55 0.01 255);
  font-size: 11.5px;
}

.warning-row__arrow {
  color: oklch(0.62 0.01 255);
  font-size: 11px;
}

.empty-copy {
  margin: 0;
}

.selected-card {
  display: grid;
  gap: 4px;
}

.selected-card__type {
  color: oklch(0.56 0.012 255);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.district-view {
  display: grid;
  gap: 14px;
}

.district-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.district-header h1 {
  margin: 0;
  color: oklch(0.22 0.014 255);
  font-size: 27px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.district-header > p {
  margin: 0;
  color: oklch(0.5 0.01 255);
  font-family: "IBM Plex Mono", monospace;
  font-size: 11px;
}

.back-button {
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid oklch(0.88 0.008 255);
  border-radius: 7px;
  padding: 6px 12px 6px 9px;
  background: #fff;
  color: oklch(0.50 0.12 255);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
}

.back-button span {
  font-size: 18px;
  line-height: 1;
}

.location-row {
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
}

.location-row__icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: oklch(0.96 0.012 220);
  color: oklch(0.48 0.06 220);
  font-size: 13px;
}

.location-row__temp {
  flex: none;
  font-family: "IBM Plex Mono", monospace;
  font-size: 15.5px;
}

.location-row__temp strong {
  color: oklch(0.58 0.18 35);
  font-size: 15.5px;
}

.location-row__temp em {
  color: oklch(0.78 0.01 255);
  font-style: normal;
}

.location-row__arrow {
  flex: none;
  color: oklch(0.58 0.01 255);
  font-size: 13px;
}

@media (max-width: 920px) {
  .maps-hero,
  .panel-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .maps-updated,
  .atlas-grid,
  .district-grid {
    grid-template-columns: 1fr;
  }

  .map-frame {
    flex-direction: column;
    align-items: center;
    min-height: 300px;
    padding-inline: 8px;
  }

  .legend {
    position: static;
    width: 100%;
    margin-top: 14px;
  }
}

@media (max-width: 560px) {
  .maps-page {
    gap: 14px;
  }

  .mini-grid {
    grid-template-columns: 1fr;
  }
}
</style>
