<script setup lang="ts">
import { PT_GEO } from '~/utils/portugal-geo-data'
import { projPoint, iconSvg, isNowDaytime, dirDeg, FIRE, SEA_POINTS, CAPITALS } from '~/utils/maps'
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
  points,
  choro,
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
  points?: any[]
  choro?: Record<string, any>
}>()

const mapId = `pt-${useId().replace(/[^a-zA-Z0-9_-]/g, '-')}`

const emit = defineEmits<{ pick: [pick: MapPick] }>()

const GEO = PT_GEO.groups
const capitalDistrictByName = new Map(CAPITALS.map(capital => [capital.name, capital.district]))
const renderedSvgHeights = reactive<Partial<Record<MapGroup, number>>>({})
const svgEls = new Map<MapGroup, SVGSVGElement>()
const svgGroups = new WeakMap<Element, MapGroup>()
let svgResizeObserver: ResizeObserver | null = null

function updateRenderedSvgHeight(group: MapGroup, el: SVGSVGElement) {
  renderedSvgHeights[group] = el.getBoundingClientRect().height || groupHeights.value[group]
}

function setSvgEl(group: MapGroup, el: SVGSVGElement | null) {
  if (!import.meta.client) return
  const previous = svgEls.get(group)
  if (previous && previous !== el) svgResizeObserver?.unobserve(previous)
  if (!el) {
    svgEls.delete(group)
    delete renderedSvgHeights[group]
    return
  }

  svgEls.set(group, el)
  svgGroups.set(el, group)
  svgResizeObserver?.observe(el)
  nextTick(() => updateRenderedSvgHeight(group, el))
}

onMounted(() => {
  svgResizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const group = svgGroups.get(entry.target)
      if (group) renderedSvgHeights[group] = entry.contentRect.height || groupHeights.value[group]
    }
  })
  for (const [group, el] of svgEls) {
    svgResizeObserver.observe(el)
    updateRenderedSvgHeight(group, el)
  }
})

onBeforeUnmount(() => {
  svgResizeObserver?.disconnect()
  svgResizeObserver = null
})

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

function viewBoxBounds(group: MapGroup): [number, number, number, number] {
  if (focus?.district) {
    const district = PT_GEO.districts.find(d => d.group === group && d.name === focus.district)
    if (district?.bbox) {
      const [x0, y0, x1, y1] = district.bbox
      const padX = Math.max(16, (x1 - x0) * 0.12)
      const padY = Math.max(16, (y1 - y0) * 0.12)
      return [x0 - padX, y0 - padY, x1 - x0 + padX * 2, y1 - y0 + padY * 2]
    }
  }
  return [0, 0, GEO[group].w, GEO[group].h]
}

function viewBoxFor(group: MapGroup): string {
  return viewBoxBounds(group).join(' ')
}

function districtsFor(group: MapGroup) {
  return PT_GEO.districts.filter(d => d.group === group)
}

function choroEntry(name: string) {
  if (!choro) return null
  return choro[name] ?? choro[name === 'Açores' ? 'Azores' : name] ?? null
}

function districtFill(name: string): string {
  if (focus?.district === name) return 'oklch(0.93 0.013 200)'
  if (focus) return 'oklch(0.958 0.006 240)'
  if (choro) {
    const e = choroEntry(name)
    if (layer === 'warnings') return e ? e.soft : 'oklch(0.93 0.008 150)'
    if (layer === 'fire') return e ? e.fill : fireColor(1)
  }
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
  if (choro) {
    const e = choroEntry(name)
    if (layer === 'warnings') return e ? e.color : 'oklch(0.78 0.012 200)'
    if (layer === 'fire') return 'oklch(0.94 0.005 255)'
  }
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

function districtNameForMarker(point: { name: string; district?: string }): string | undefined {
  return capitalDistrictByName.get(point.name) ?? point.district
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
  district?: string
  showName?: boolean
  dotOnly?: boolean
  isCapital?: boolean
}

function fcMarkers(group: MapGroup): Marker[] {
  if (points) {
    const pointMarkers = (points as (FcPoint & { isCapital?: boolean })[])
      .filter(pt => pt.group === group && pt.tmax != null)
      .map((pt) => {
        const { x, y } = projPoint(group, pt.lon, pt.lat)
        const district = districtNameForMarker(pt)
        return {
          id: pt.id,
          name: pt.name,
          district,
          x,
          y,
          fill: tempFill(pt.tmax!),
          textColor: tempColor(pt.tmax!),
          icon: pt.wt ? iconSvg(pt.wt, isNowDaytime()) : undefined,
          value: `${pt.tmax}°`,
          sub: pt.tmin != null ? `${pt.tmin}°` : undefined,
          showName: Boolean(focus),
          isCapital: Boolean(pt.isCapital || capitalDistrictByName.has(pt.name)),
        } satisfies Marker
      })
    return visibleForecastMarkers(group, pointMarkers)
  }

  const fcPoints = forecastData.filter(pt =>
    pt.group === group
    && pt.tmax != null
    && (!focus?.district || pt.district === focus.district)
  )

  if (!focus && variant === 'full' && group === 'mainland') {
    return districtsFor(group)
      .map((district) => {
        const pt = fcPoints.find(point => point.district === district.name)
        if (!pt || district.cx == null || district.cy == null) return null
        return {
          id: pt.id,
          name: district.name,
          district: district.name,
          x: district.cx,
          y: district.cy,
          fill: tempFill(pt.tmax!),
          textColor: tempColor(pt.tmax!),
          icon: pt.wt ? iconSvg(pt.wt, isNowDaytime()) : undefined,
          value: `${pt.tmax}°`,
          sub: pt.tmin != null ? `${pt.tmin}°` : undefined,
          showName: true,
          isCapital: true,
        } satisfies Marker
      })
      .filter((marker): marker is Marker => marker != null)
  }

  if (variant === 'mini') {
    return fcPoints.map((pt) => {
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

  const markers = fcPoints
    .filter(pt => pt.group === group && pt.tmax != null)
    .map((pt) => {
      const { x, y } = projPoint(group, pt.lon, pt.lat)
      const district = districtNameForMarker(pt)
      return {
        id: pt.id,
        name: pt.name,
        district,
        x,
        y,
        fill: tempFill(pt.tmax!),
        textColor: tempColor(pt.tmax!),
        icon: pt.wt ? iconSvg(pt.wt, isNowDaytime()) : undefined,
        value: `${pt.tmax}°`,
        sub: pt.tmin != null ? `${pt.tmin}°` : undefined,
        showName: Boolean(focus),
        isCapital: capitalDistrictByName.has(pt.name) || Boolean(focus?.district && pt.name === focus.district),
      }
    })
  return visibleForecastMarkers(group, markers)
}

function obsMarkers(group: MapGroup): Marker[] {
  return observationData
    .filter(pt =>
      pt.group === group
      && pt.temp != null
      && (!focus?.district || pt.district === focus.district)
    )
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
    .filter(pt =>
      pt.group === group
      && pt.uv != null
      && (!focus?.district || pt.district === focus.district)
    )
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
  if (marker.isCapital && marker.district) {
    emit('pick', {
      kind: 'district',
      id: marker.district,
      name: marker.district,
    })
    return
  }

  emit('pick', {
    kind: layer === 'sea' ? 'sea' : 'location',
    id: marker.id,
    name: marker.name,
  })
}

function markerTemperature(marker: Marker): string {
  return marker.sub ? `${marker.value} / ${marker.sub}` : marker.value
}

function districtLabels(group: MapGroup) {
  if (variant === 'mini' || layer === 'forecast') return []
  return districtsFor(group).filter(district => district.cx != null && district.cy != null)
}

function districtLabelX(group: MapGroup, district: { cx?: number; bbox?: number[] }): number {
  if (group === 'azores' && district.bbox) return district.bbox[2] - 10
  if (group === 'madeira' && district.bbox) return district.bbox[0] + 8
  return district.cx ?? 0
}

function districtLabelY(group: MapGroup, district: { cy?: number; bbox?: number[] }): number {
  const warningOffset = layer === 'warnings' || layer === 'fire' ? 10 : 0
  if (group !== 'mainland' && district.bbox) return district.bbox[1] + 12 + warningOffset
  return (district.cy ?? 0) + warningOffset
}

function districtLabelAnchor(group: MapGroup): 'start' | 'middle' | 'end' {
  if (group === 'azores') return 'end'
  if (group === 'madeira') return 'start'
  return 'middle'
}

function districtLabelFont(group: MapGroup): number {
  if (group === 'mainland') return 7.4
  return 6.2
}

function districtLabelStroke(group: MapGroup): number {
  return group === 'mainland' ? 4 : 2.5
}

function screenPxToSvg(group: MapGroup, px: number): number {
  const [, , , viewHeight] = viewBoxBounds(group)
  return px * viewHeight / (renderedSvgHeights[group] ?? groupHeights.value[group])
}

function markerIconSize(group: MapGroup): number {
  if (variant === 'mini') return 7
  const px = focus ? 27 : group === 'mainland' ? 31 : 27
  return screenPxToSvg(group, px)
}

function markerValueFont(group: MapGroup): number {
  if (variant === 'mini') return 6.5
  const px = focus ? 11.5 : group === 'mainland' ? 12 : 10.5
  return screenPxToSvg(group, px)
}

function markerNameFont(group: MapGroup): number {
  const px = focus ? 10.75 : group === 'mainland' ? 11 : 10
  return screenPxToSvg(group, px)
}

function markerValueOffset(group: MapGroup): number {
  return markerIconSize(group) * 0.58
}

function markerNameOffset(group: MapGroup): number {
  return markerIconSize(group) * 0.92
}

function markerStroke(group: MapGroup, px: number): number {
  return screenPxToSvg(group, px)
}

interface MarkerBounds {
  left: number
  top: number
  right: number
  bottom: number
}

function markerBounds(group: MapGroup, marker: Marker): MarkerBounds {
  const iconSize = markerIconSize(group)
  const valueFont = markerValueFont(group)
  const nameFont = markerNameFont(group)
  const pad = screenPxToSvg(group, 5)
  const valueWidth = markerTemperature(marker).length * valueFont * 0.62
  const nameWidth = marker.showName ? marker.name.length * nameFont * 0.58 : 0
  const width = Math.max(iconSize, valueWidth, nameWidth) + pad * 2
  const top = marker.y - iconSize * 0.58 - pad
  const bottom = marker.showName
    ? marker.y + markerNameOffset(group) + nameFont * 0.35 + pad
    : marker.y + markerValueOffset(group) + valueFont * 0.35 + pad
  return {
    left: marker.x - width / 2,
    top,
    right: marker.x + width / 2,
    bottom,
  }
}

function boundsOverlap(a: MarkerBounds, b: MarkerBounds): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
}

function visibleForecastMarkers(group: MapGroup, input: Marker[]): Marker[] {
  if (!focus || variant !== 'full' || layer !== 'forecast') return input

  const kept: { marker: Marker; bounds: MarkerBounds }[] = []
  const ordered = input
    .map((marker, index) => ({ marker, index }))
    .sort((a, b) => Number(b.marker.isCapital) - Number(a.marker.isCapital) || a.index - b.index)

  for (const item of ordered) {
    const bounds = markerBounds(group, item.marker)
    if (kept.some(existing => boundsOverlap(bounds, existing.bounds))) continue
    kept.push({ marker: item.marker, bounds })
  }

  return kept
    .sort((a, b) => input.indexOf(a.marker) - input.indexOf(b.marker))
    .map(item => item.marker)
}

function heatBlobR(group: MapGroup): number {
  if (focus?.district) {
    const [, , vbW, vbH] = viewBoxBounds(group)
    return Math.hypot(vbW, vbH) * 0.22
  }
  const g = GEO[group]
  return Math.hypot(g.w, g.h) * (group === 'mainland' ? 0.17 : 0.27)
}

function heatClipPath(group: MapGroup): string {
  if (focus?.district) {
    const d = PT_GEO.districts.find(dist => dist.group === group && dist.name === focus.district)
    if (d) return d.d
  }
  return districtsFor(group).map(d => d.d).join(' ')
}

function heatItems(group: MapGroup): { x: number; y: number; color: string }[] {
  if (variant !== 'full') return []
  if (layer === 'forecast') return fcMarkers(group).map(m => ({ x: m.x, y: m.y, color: m.fill }))
  if (layer === 'observations') return obsMarkers(group).map(m => ({ x: m.x, y: m.y, color: m.fill }))
  if (layer === 'uv') return uvMarkers(group).map(m => ({ x: m.x, y: m.y, color: m.fill }))
  return []
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
      <div v-if="variant !== 'mini'" class="pt-map__label">
        {{ groupLabel(group) }}
      </div>
      <svg
        :ref="(el) => setSvgEl(group, el as SVGSVGElement | null)"
        :viewBox="viewBoxFor(group)"
        :width="groupWidth(group)"
        :height="groupHeights[group]"
        class="pt-map__svg"
        role="img"
        :aria-label="groupLabel(group)"
      >
        <!-- heat-field defs (always declared so IDs are stable in the DOM) -->
        <defs v-if="variant === 'full' && (layer === 'forecast' || layer === 'observations' || layer === 'uv')">
          <clipPath :id="`${mapId}-clip-${group}`">
            <path :d="heatClipPath(group)" />
          </clipPath>
          <filter :id="`${mapId}-blur-${group}`" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB">
            <feGaussianBlur :stdDeviation="heatBlobR(group) * 0.32" />
          </filter>
          <radialGradient
            v-for="(pt, i) in heatItems(group)"
            :key="`${mapId}-grad-${group}-${i}`"
            :id="`${mapId}-grad-${group}-${i}`"
            gradientUnits="userSpaceOnUse"
            :cx="pt.x"
            :cy="pt.y"
            :r="heatBlobR(group)"
          >
            <stop offset="0%" :stop-color="pt.color" stop-opacity="0.52" />
            <stop offset="55%" :stop-color="pt.color" stop-opacity="0.22" />
            <stop offset="100%" :stop-color="pt.color" stop-opacity="0" />
          </radialGradient>
        </defs>

        <rect :width="GEO[group].w" :height="GEO[group].h" fill="oklch(0.965 0.014 230)" />

        <!-- Phase 1: district fills only (no stroke) — click targets -->
        <path
          v-for="district in districtsFor(group)"
          :key="district.name"
          :d="district.d"
          :data-district="district.name"
          :fill="districtFill(district.name)"
          stroke="none"
          :class="{ 'pt-map__district--pickable': isDistrictPickable(district.name) }"
          @click="pickDistrict(district.name)"
        />

        <path
          v-for="district in districtsFor(group).filter(d => group !== 'mainland')"
          :key="`hit-${district.name}`"
          :d="district.d"
          :data-district-hit="district.name"
          fill="none"
          stroke="transparent"
          stroke-width="14"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="pt-map__district--pickable"
          @click="pickDistrict(district.name)"
        />

        <!-- Phase 2: heat-field overlay on top of fills -->
        <g
          v-if="heatItems(group).length"
          :clip-path="`url(#${mapId}-clip-${group})`"
          :filter="`url(#${mapId}-blur-${group})`"
          style="pointer-events:none;"
        >
          <circle
            v-for="(pt, i) in heatItems(group)"
            :key="`${mapId}-hc-${group}-${i}`"
            :cx="pt.x"
            :cy="pt.y"
            :r="heatBlobR(group)"
            :fill="`url(#${mapId}-grad-${group}-${i})`"
          />
        </g>

        <!-- Phase 3: non-focused district strokes on top of heat -->
        <path
          v-for="district in districtsFor(group)"
          :key="`s-${district.name}`"
          :d="district.d"
          fill="none"
          :stroke="districtStroke(district.name)"
          stroke-width="0.8"
          style="pointer-events:none;"
        />

        <!-- Phase 4: focused district stroke rendered last so it's on top -->
        <path
          v-if="focus?.district && districtsFor(group).some(d => d.name === focus.district)"
          :d="districtsFor(group).find(d => d.name === focus.district)!.d"
          fill="none"
          :stroke="accent"
          stroke-width="2.2"
          style="pointer-events:none;"
        />

        <text
          v-for="district in districtLabels(group)"
          :key="`label-${district.name}`"
          :x="districtLabelX(group, district)"
          :y="districtLabelY(group, district)"
          :text-anchor="districtLabelAnchor(group)"
          font-family="IBM Plex Sans, sans-serif"
          :font-size="districtLabelFont(group)"
          font-weight="600"
          fill="oklch(0.44 0.014 255)"
          paint-order="stroke"
          stroke="oklch(0.99 0.003 255 / 0.92)"
          :stroke-width="districtLabelStroke(group)"
          stroke-linejoin="round"
          style="pointer-events:none;"
        >{{ district.name }}</text>

        <g
          v-for="marker in markers(group)"
          :key="marker.id"
          class="pt-map__marker"
          @click="pickMarker(marker)"
        >
          <template v-if="layer === 'forecast' && marker.icon">
            <template v-if="marker.dotOnly">
              <circle :cx="marker.x" :cy="marker.y" r="3.6" :fill="marker.fill" stroke="#fff" stroke-width="0.8" />
            </template>
            <template v-else>
              <image :x="marker.x - markerIconSize(group) / 2" :y="marker.y - markerIconSize(group) * 0.58" :width="markerIconSize(group)" :height="markerIconSize(group)" :href="marker.icon" />
              <text :x="marker.x" :y="marker.y + markerValueOffset(group)" text-anchor="middle" font-family="IBM Plex Mono, monospace" :font-size="markerValueFont(group)" font-weight="700" :fill="marker.textColor" paint-order="stroke" stroke="#fff" :stroke-width="markerStroke(group, 4.25)" stroke-linejoin="round">{{ markerTemperature(marker) }}</text>
              <text v-if="marker.showName" :x="marker.x" :y="marker.y + markerNameOffset(group)" text-anchor="middle" font-family="IBM Plex Sans, sans-serif" :font-size="markerNameFont(group)" font-weight="700" fill="oklch(0.22 0.014 255)" paint-order="stroke" stroke="#fff" :stroke-width="markerStroke(group, 3.75)" stroke-linejoin="round">{{ marker.name }}</text>
            </template>
          </template>

          <template v-else-if="focus && (layer === 'warnings' || layer === 'fire') && marker.icon">
            <image :x="marker.x - markerIconSize(group) / 2" :y="marker.y - markerIconSize(group) * 0.58" :width="markerIconSize(group)" :height="markerIconSize(group)" :href="marker.icon" />
            <text :x="marker.x" :y="marker.y + markerValueOffset(group)" text-anchor="middle" font-family="IBM Plex Mono, monospace" :font-size="markerValueFont(group)" font-weight="700" :fill="marker.textColor" paint-order="stroke" stroke="#fff" :stroke-width="markerStroke(group, 4.25)" stroke-linejoin="round">{{ markerTemperature(marker) }}</text>
            <text :x="marker.x" :y="marker.y + markerNameOffset(group)" text-anchor="middle" font-family="IBM Plex Sans, sans-serif" :font-size="markerNameFont(group)" font-weight="700" fill="oklch(0.22 0.014 255)" paint-order="stroke" stroke="#fff" :stroke-width="markerStroke(group, 3.75)" stroke-linejoin="round">{{ marker.name }}</text>
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
  width: 100%;
}

.pt-map__group {
  flex: none;
  min-width: 0;
}

.pt-map--focus .pt-map__group {
  width: 100%;
}

.pt-map__group--azores,
.pt-map__group--madeira {
  max-width: 260px;
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

.pt-map--focus .pt-map__svg {
  width: 100%;
  height: auto;
  overflow: hidden;
}

.pt-map--focus .pt-map__group--azores,
.pt-map--focus .pt-map__group--madeira {
  max-width: none;
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
