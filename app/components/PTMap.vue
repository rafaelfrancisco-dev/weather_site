<script setup lang="ts">
import { PT_GEO } from '~/utils/portugal-geo-data'
import { projPoint, iconSvg, isNowDaytime, dirDeg, FIRE, SEA_POINTS } from '~/utils/maps'
import { tempFill, uvColor, waveFill, levelSoft, fireColor, tempColor } from '~/utils/colors'
import type { WarningLevel } from '~/utils/colors'
import type { FcPoint, MapFocus, MapGroup, MapLayer, MapPick, ObsPoint, WarnEntry } from '#shared/map-types'

const {
  layer,
  variant = 'full',
  focus = null,
  height,
  lang,
  accent,
  forecastData = [],
  observationData = [],
  warningData = {},
  fireData = {},
} = defineProps<{
  layer: MapLayer
  variant?: 'full' | 'mini'
  focus?: MapFocus | null
  height: number
  lang: 'en' | 'pt'
  accent: string
  forecastData?: FcPoint[]
  observationData?: ObsPoint[]
  warningData?: Record<string, WarnEntry>
  fireData?: Record<string, number>
}>()

const emit = defineEmits<{ pick: [pick: MapPick] }>()

const hover = ref<string | null>(null)
const GEO = PT_GEO.groups

const renderedGroups = computed<MapGroup[]>(() => {
  if (focus) return [focus.group]
  if (variant === 'mini') return ['mainland']
  return ['mainland', 'azores', 'madeira']
})

const groupHeights = computed<Record<MapGroup, number>>(() => {
  if (variant === 'mini') {
    return { mainland: height, azores: height, madeira: height }
  }
  if (focus) {
    return { mainland: height, azores: height, madeira: height }
  }
  return { mainland: height, azores: Math.max(118, Math.round(height * 0.29)), madeira: Math.max(92, Math.round(height * 0.2)) }
})

function groupWidth(group: MapGroup): number {
  if (focus?.district) {
    const district = PT_GEO.districts.find(d => d.group === group && d.name === focus.district)
    if (district?.bbox) {
      const [x0, y0] = district.bbox
      const [, , x1, y1] = district.bbox
      const padX = Math.max(16, (x1 - x0) * 0.12)
      const padY = Math.max(16, (y1 - y0) * 0.12)
      return Math.round(groupHeights.value[group] * (x1 - x0 + padX * 2) / (y1 - y0 + padY * 2))
    }
  }
  const geo = GEO[group]
  return Math.round(groupHeights.value[group] * geo.w / geo.h)
}

function viewBoxFor(group: MapGroup): string {
  if (focus?.district) {
    const district = PT_GEO.districts.find(d => d.group === group && d.name === focus.district)
    if (district?.bbox) {
      const [x0, y0, x1, y1] = district.bbox
      const padX = Math.max(16, (x1 - x0) * 0.12)
      const padY = Math.max(16, (y1 - y0) * 0.12)
      return `${x0 - padX} ${y0 - padY} ${x1 - x0 + padX * 2} ${y1 - y0 + padY * 2}`
    }
  }
  return `0 0 ${GEO[group].w} ${GEO[group].h}`
}

function districtsFor(group: MapGroup) {
  return PT_GEO.districts.filter(d => d.group === group)
}

function districtFill(name: string): string {
  if (focus?.district === name) return 'oklch(0.93 0.013 200)'
  if (focus) return 'oklch(0.958 0.006 240)'
  if (layer === 'warnings') {
    const warning = warningData[name]
    if (warning) return levelSoft(warning.level as WarningLevel)
  }
  if (layer === 'fire') {
    const risk = fireData[name] ?? FIRE[name] ?? 0
    if (risk > 0) return fireColor(risk)
  }
  return 'oklch(0.925 0.012 200)'
}

function districtStroke(name: string): string {
  if (focus?.district === name) return accent
  if (focus) return 'oklch(0.89 0.008 240)'
  if (layer === 'warnings' && warningData[name]) return 'oklch(0.72 0.04 250)'
  if (layer === 'fire' && ((fireData[name] ?? FIRE[name] ?? 0) > 0)) return 'oklch(0.65 0.06 50)'
  return 'oklch(0.86 0.01 240)'
}

function isDistrictPickable(name: string): boolean {
  return Boolean(name)
}

function pickDistrict(name: string) {
  emit('pick', { kind: 'district', id: name, name })
}

interface Marker {
  id: string
  name: string
  x: number
  y: number
  fill: string
  textColor: string
  icon?: string
  value: string
  sub?: string
  deg?: number
  arrowColor?: string
  showName?: boolean
  dotOnly?: boolean
}

function fcMarkers(group: MapGroup): Marker[] {
  const points = forecastData.filter(pt => pt.group === group && pt.tmax != null)

  if (!focus && variant === 'full' && group === 'mainland') {
    return districtsFor(group)
      .map((district) => {
        const pt = points.find(point => point.district === district.name)
        if (!pt || district.cx == null || district.cy == null) return null
        return {
          id: pt.id,
          name: district.name,
          x: district.cx,
          y: district.cy,
          fill: tempFill(pt.tmax!),
          textColor: tempColor(pt.tmax!),
          icon: pt.wt ? iconSvg(pt.wt, isNowDaytime()) : undefined,
          value: `${pt.tmax}°`,
          sub: pt.tmin != null ? `${pt.tmin}°` : undefined,
          showName: true,
        } satisfies Marker
      })
      .filter((marker): marker is Marker => marker != null)
  }

  if (variant === 'mini') {
    return points.map((pt) => {
      const { x, y } = projPoint(group, pt.lon, pt.lat)
      return {
        id: pt.id,
        name: pt.name,
        x,
        y,
        fill: tempFill(pt.tmax!),
        textColor: tempColor(pt.tmax!),
        value: `${pt.tmax}°`,
        dotOnly: true,
      }
    })
  }

  return points
    .filter(pt => pt.group === group && pt.tmax != null)
    .map((pt) => {
      const { x, y } = projPoint(group, pt.lon, pt.lat)
      return {
        id: pt.id,
        name: pt.name,
        x,
        y,
        fill: tempFill(pt.tmax!),
        textColor: tempColor(pt.tmax!),
        icon: pt.wt ? iconSvg(pt.wt, isNowDaytime()) : undefined,
        value: `${pt.tmax}°`,
        sub: pt.tmin != null ? `${pt.tmin}°` : undefined,
        showName: Boolean(focus),
      }
    })
}

function obsMarkers(group: MapGroup): Marker[] {
  return observationData
    .filter(pt => pt.group === group && pt.temp != null)
    .map((pt) => {
      const { x, y } = projPoint(group, pt.lon, pt.lat)
      return {
        id: String(pt.id),
        name: pt.name,
        x,
        y,
        fill: tempFill(pt.temp!),
        textColor: tempColor(pt.temp!),
        value: `${Math.round(pt.temp!)}°`,
      }
    })
}

function uvMarkers(group: MapGroup): Marker[] {
  return forecastData
    .filter(pt => pt.group === group && pt.uv != null)
    .map((pt) => {
      const { x, y } = projPoint(group, pt.lon, pt.lat)
      return { id: pt.id, name: pt.name, x, y, fill: uvColor(pt.uv!), textColor: '#fff', value: String(pt.uv) }
    })
}

function seaMarkers(group: MapGroup): Marker[] {
  return SEA_POINTS
    .filter(sp => sp.group === group)
    .map((sp) => {
      const { x, y } = projPoint(group, sp.lon, sp.lat)
      return {
        id: sp.id,
        name: sp.name,
        x,
        y,
        fill: waveFill(sp.h),
        textColor: sp.h >= 3 ? '#fff' : 'oklch(0.25 0.05 250)',
        value: `${sp.h}m`,
        deg: dirDeg(sp.dir),
        arrowColor: sp.h >= 3 ? 'rgba(255,255,255,0.8)' : 'oklch(0.3 0.08 250)',
      }
    })
}

function markers(group: MapGroup): Marker[] {
  if (focus && (layer === 'warnings' || layer === 'fire')) return fcMarkers(group)
  if (layer === 'forecast') return fcMarkers(group)
  if (layer === 'observations') return obsMarkers(group)
  if (layer === 'uv') return uvMarkers(group)
  if (layer === 'sea') return seaMarkers(group)
  return []
}

function pickMarker(marker: Marker) {
  emit('pick', {
    kind: layer === 'sea' ? 'sea' : 'location',
    id: marker.id,
    name: marker.name,
  })
}

function tooltipFor(marker: Marker): string {
  if (layer === 'forecast' || (focus && (layer === 'warnings' || layer === 'fire'))) return `${marker.name} ${marker.value}${marker.sub ? ` / ${marker.sub}` : ''}`
  return `${marker.name} ${marker.value}`
}

function districtLabels(group: MapGroup) {
  if (variant === 'mini' || layer === 'forecast') return []
  return districtsFor(group).filter(district => district.cx != null && district.cy != null)
}

function groupLabel(group: MapGroup): string {
  if (group === 'azores') return lang === 'pt' ? 'Açores' : 'Azores'
  if (group === 'madeira') return 'Madeira'
  return lang === 'pt' ? 'Continente' : 'Mainland'
}
</script>

<template>
  <div
    class="pt-map"
    :class="{ 'pt-map--mini': variant === 'mini', 'pt-map--focus': focus }"
  >
    <section
      v-for="group in renderedGroups"
      :key="group"
      class="pt-map__group"
      :class="`pt-map__group--${group}`"
    >
      <div v-if="variant !== 'mini' && group !== 'mainland'" class="pt-map__label">
        {{ groupLabel(group) }}
      </div>
      <svg
        :viewBox="viewBoxFor(group)"
        :width="groupWidth(group)"
        :height="groupHeights[group]"
        class="pt-map__svg"
        role="img"
        :aria-label="groupLabel(group)"
      >
        <rect :width="GEO[group].w" :height="GEO[group].h" fill="oklch(0.965 0.014 230)" />
        <path
          v-for="district in districtsFor(group)"
          :key="district.name"
          :d="district.d"
          :fill="districtFill(district.name)"
          :stroke="districtStroke(district.name)"
          :stroke-width="focus?.district === district.name ? 2.2 : 0.8"
          :class="{ 'pt-map__district--pickable': isDistrictPickable(district.name) }"
          @click="pickDistrict(district.name)"
        >
          <title>{{ district.name }}</title>
        </path>

        <text
          v-for="district in districtLabels(group)"
          :key="`label-${district.name}`"
          :x="district.cx"
          :y="(district.cy ?? 0) + (layer === 'warnings' || layer === 'fire' ? 10 : 0)"
          text-anchor="middle"
          font-family="IBM Plex Sans, sans-serif"
          :font-size="group === 'mainland' ? 7.4 : 8.5"
          font-weight="600"
          fill="oklch(0.44 0.014 255)"
          paint-order="stroke"
          stroke="oklch(0.99 0.003 255 / 0.92)"
          stroke-width="4"
          stroke-linejoin="round"
          style="pointer-events:none;"
        >{{ district.name }}</text>

        <g
          v-for="marker in markers(group)"
          :key="marker.id"
          class="pt-map__marker"
          @click="pickMarker(marker)"
          @mouseenter="hover = marker.id"
          @mouseleave="hover = null"
        >
          <template v-if="layer === 'forecast' && marker.icon">
            <template v-if="marker.dotOnly">
              <circle :cx="marker.x" :cy="marker.y" r="3.6" :fill="marker.fill" stroke="#fff" stroke-width="0.8" />
            </template>
            <template v-else>
              <image :x="marker.x - 13" :y="marker.y - 15" width="26" height="26" :href="marker.icon" />
              <text :x="marker.x" :y="marker.y + 16" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="9.2" font-weight="700" :fill="marker.textColor" paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round">{{ marker.value }}</text>
              <text v-if="marker.showName" :x="marker.x" :y="marker.y + 26" text-anchor="middle" font-family="IBM Plex Sans, sans-serif" :font-size="focus ? 8.2 : 7.4" font-weight="700" fill="oklch(0.22 0.014 255)" paint-order="stroke" stroke="#fff" stroke-width="4.5" stroke-linejoin="round">{{ marker.name }}</text>
            </template>
          </template>

          <template v-else-if="focus && (layer === 'warnings' || layer === 'fire') && marker.icon">
            <image :x="marker.x - 13" :y="marker.y - 15" width="26" height="26" :href="marker.icon" />
            <text :x="marker.x" :y="marker.y + 16" text-anchor="middle" font-family="IBM Plex Mono, monospace" font-size="9.2" font-weight="700" :fill="marker.textColor" paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round">{{ marker.value }}</text>
            <text :x="marker.x" :y="marker.y + 26" text-anchor="middle" font-family="IBM Plex Sans, sans-serif" font-size="8.2" font-weight="700" fill="oklch(0.22 0.014 255)" paint-order="stroke" stroke="#fff" stroke-width="4.5" stroke-linejoin="round">{{ marker.name }}</text>
          </template>

          <template v-else-if="layer === 'observations' || layer === 'uv'">
            <circle :cx="marker.x" :cy="marker.y" :r="variant === 'mini' ? 8 : 11" :fill="marker.fill" stroke="oklch(0.86 0.01 240)" stroke-width="0.8" />
            <text :x="marker.x" :y="marker.y + 4" text-anchor="middle" font-family="IBM Plex Mono, monospace" :font-size="variant === 'mini' ? 6.5 : 8" font-weight="700" :fill="marker.textColor" paint-order="stroke" stroke="oklch(0.92 0.005 255)" stroke-width="2" stroke-linejoin="round">{{ marker.value }}</text>
          </template>

          <template v-else-if="layer === 'sea'">
            <circle :cx="marker.x" :cy="marker.y" :r="variant === 'mini' ? 9 : 13" :fill="marker.fill" stroke="oklch(0.78 0.04 240)" stroke-width="0.8" />
            <text :x="marker.x" :y="marker.y + 3" text-anchor="middle" font-family="IBM Plex Mono, monospace" :font-size="variant === 'mini' ? 5.8 : 7.5" font-weight="700" :fill="marker.textColor">{{ marker.value }}</text>
            <text v-if="marker.deg != null && variant !== 'mini'" :x="marker.x" :y="marker.y - 5" text-anchor="middle" font-family="IBM Plex Sans, monospace" font-size="9" :fill="marker.arrowColor" :transform="`rotate(${marker.deg}, ${marker.x}, ${marker.y - 5})`">↑</text>
          </template>

          <g v-if="variant !== 'mini' && hover === marker.id">
            <rect :x="marker.x - 36" :y="marker.y - 38" width="72" height="15" rx="3" fill="oklch(0.22 0.02 255)" fill-opacity="0.9" />
            <text :x="marker.x" :y="marker.y - 27.5" text-anchor="middle" font-family="IBM Plex Sans, sans-serif" font-size="7" font-weight="600" fill="#fff">{{ tooltipFor(marker) }}</text>
          </g>
        </g>
      </svg>
    </section>
  </div>
</template>

<style scoped>
.pt-map {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 10px;
  max-width: 100%;
  overflow: hidden;
}

.pt-map--mini {
  width: 100%;
  height: 100%;
  align-items: center;
}

.pt-map--focus {
  align-items: center;
}

.pt-map__group {
  flex: none;
  min-width: 0;
}

.pt-map__group--azores,
.pt-map__group--madeira {
  max-width: 190px;
}

.pt-map__label {
  padding: 0 2px 4px;
  color: oklch(0.55 0.01 255);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.08em;
  line-height: 1;
  text-transform: uppercase;
}

.pt-map__svg {
  display: block;
  max-width: 100%;
  height: auto;
  overflow: visible;
}

.pt-map__district--pickable {
  cursor: pointer;
}

.pt-map__district--pickable:hover {
  filter: saturate(1.1) brightness(0.98);
}

.pt-map__marker {
  cursor: pointer;
}

@media (max-width: 560px) {
  .pt-map:not(.pt-map--mini) {
    flex-direction: column;
    align-items: center;
  }

  .pt-map__group--azores,
  .pt-map__group--madeira {
    max-width: 100%;
  }
}
</style>
