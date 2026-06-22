<script setup lang="ts">
import type { ObservationGrid } from '~/utils/transform'
import { densityStyles } from '~/composables/useSettings'

const props = defineProps<{
  observationGrid: ObservationGrid
  t: Record<string, string>
  mobile: boolean
  primary: string
  soft: string
}>()

const settings = useSettings()
const dens = computed(() => densityStyles(settings.value.density))
</script>

<template>
  <div>
    <div style="margin-bottom:12px;">
      <div style="font-size:13.5px; font-weight:600; color:oklch(0.30 0.012 255);">{{ props.t.obsTitle }}</div>
      <div style="font-size:11.5px; color:oklch(0.55 0.01 255); margin-top:3px;">{{ props.observationGrid.summary }}</div>
    </div>

    <!-- desktop grid -->
    <div v-if="!props.mobile" style="border:1px solid oklch(0.86 0.01 255); border-radius:6px; overflow:hidden; background:#fff;">
      <div style="overflow-x:auto;">
        <table style="border-collapse:collapse; width:100%; min-width:640px; table-layout:fixed;">
          <thead>
            <tr>
              <th rowspan="2" scope="col" style="position:sticky; left:0; z-index:7; width:118px; min-width:118px; background:oklch(0.945 0.008 255); border-bottom:2px solid oklch(0.82 0.012 255); border-right:1px solid oklch(0.88 0.008 255); padding:7px 10px; text-align:left; font-size:10px; font-weight:700; letter-spacing:0.05em; text-transform:uppercase; color:oklch(0.45 0.012 255);">{{ props.observationGrid.stationLabel }}</th>
              <th rowspan="2" scope="col" style="position:sticky; left:118px; z-index:7; width:84px; min-width:84px; background:oklch(0.96 0.006 255); border-bottom:2px solid oklch(0.82 0.012 255); border-right:2px solid oklch(0.84 0.012 255); padding:7px 9px; text-align:left; font-size:10px; font-weight:700; letter-spacing:0.05em; text-transform:uppercase; color:oklch(0.5 0.012 255);">{{ props.observationGrid.paramLabel }}</th>
              <th
                v-if="props.observationGrid.timeCols.length > 0"
                :colspan="props.observationGrid.timeCols.length"
                scope="colgroup"
                style="background:oklch(0.965 0.006 255); border-bottom:1px solid oklch(0.86 0.01 255); padding:5px 4px; text-align:center; font-size:10px; font-weight:700; letter-spacing:0.05em; text-transform:uppercase; color:oklch(0.45 0.012 255);"
              >{{ props.observationGrid.timeLabel }}</th>
            </tr>
            <tr>
              <th
                v-for="(tc, i) in props.observationGrid.timeCols"
                :key="i"
                scope="col"
                :style="{ background: tc.bg, borderBottom: '2px solid oklch(0.82 0.012 255)', padding: '7px 4px', fontFamily: 'IBM Plex Mono, monospace', fontSize: '11.5px', fontWeight: tc.weight, color: tc.color, textAlign: 'center' }"
              >{{ tc.label }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, ri) in props.observationGrid.rows" :key="ri">
              <th
                v-if="r.first"
                :rowspan="r.stationRowspan"
                scope="rowgroup"
                :style="{ position: 'sticky', left: '0', zIndex: 6, width: '118px', minWidth: '118px', background: r.stationBg, borderTop: r.topBorder, borderRight: '1px solid oklch(0.88 0.008 255)', padding: dens.pad, textAlign: 'left', verticalAlign: 'top', fontSize: dens.fz, fontWeight: 700, color: 'oklch(0.24 0.016 255)', lineHeight: 1.25 }"
              >{{ r.station }}</th>
              <th scope="row" :style="{ position: 'sticky', left: '118px', zIndex: 5, width: '84px', minWidth: '84px', background: r.labelBg, borderTop: r.topBorder, borderRight: '2px solid oklch(0.84 0.012 255)', borderBottom: '1px solid oklch(0.95 0.005 255)', padding: dens.pad, textAlign: 'left', fontSize: dens.fz, fontWeight: 500, color: 'oklch(0.42 0.012 255)', whiteSpace: 'nowrap' }">
                {{ r.label }}
                <span style="color:oklch(0.66 0.01 255); font-size:9.5px; font-weight:400;">{{ r.unit }}</span>
              </th>
              <td
                v-for="(cell, ci) in r.cells"
                :key="ci"
                :style="{ borderTop: r.topBorder, borderBottom: '1px solid oklch(0.96 0.004 255)', borderLeft: cell.sideBorder, background: cell.bg, padding: dens.cellPad, textAlign: 'center' }"
              >
                <div v-if="cell.isWind" style="display:flex; align-items:center; justify-content:center; gap:2px;">
                  <span :style="{ fontSize: '10px', lineHeight: 1, color: 'oklch(0.45 0.03 255)', transform: `rotate(${cell.deg}deg)` }">↑</span>
                  <span :style="{ fontFamily: 'IBM Plex Mono, monospace', fontSize: dens.fz, fontWeight: cell.weight, color: cell.color }">{{ cell.main }}</span>
                </div>
                <span v-if="cell.isText" :style="{ fontFamily: 'IBM Plex Mono, monospace', fontSize: dens.fz, fontWeight: cell.weight, color: cell.color }">{{ cell.main }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- mobile station cards -->
    <div v-if="props.mobile" style="display:flex; flex-direction:column; gap:14px;">
      <div v-for="(card, ci) in props.observationGrid.stationCards" :key="ci" style="border:1px solid oklch(0.86 0.01 255); border-radius:8px; overflow:hidden; background:#fff;">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; padding:9px 12px; background:oklch(0.955 0.007 255); border-bottom:1px solid oklch(0.86 0.01 255);">
          <span style="font-size:13px; font-weight:700; color:oklch(0.24 0.016 255); line-height:1.2;">{{ card.name }}</span>
          <span :style="{ flex: 'none', fontFamily: 'IBM Plex Mono, monospace', fontSize: '10px', fontWeight: 600, color: props.primary, background: props.soft, borderRadius: '4px', padding: '2px 6px' }">{{ card.latestLabel }}</span>
        </div>
        <div style="overflow-x:auto; -webkit-overflow-scrolling:touch;">
          <table style="border-collapse:collapse; width:100%; min-width:max-content;">
            <thead>
              <tr>
                <th style="position:sticky; left:0; z-index:3; background:oklch(0.97 0.005 255); border-bottom:2px solid oklch(0.84 0.012 255); border-right:2px solid oklch(0.84 0.012 255); padding:5px 9px; text-align:left; font-size:9.5px; font-weight:700; letter-spacing:0.05em; text-transform:uppercase; color:oklch(0.5 0.012 255); white-space:nowrap;">{{ props.observationGrid.paramLabel }}</th>
                <th
                  v-for="(tc, i) in props.observationGrid.timeCols"
                  :key="i"
                  :style="{ background: tc.bg, borderBottom: '2px solid oklch(0.84 0.012 255)', padding: '5px 4px', fontFamily: 'IBM Plex Mono, monospace', fontSize: '10.5px', fontWeight: tc.weight, color: tc.color, textAlign: 'center', minWidth: '44px' }"
                >{{ tc.label }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, ri) in card.rows" :key="ri">
                <th :style="{ position: 'sticky', left: '0', zIndex: 2, background: '#fff', borderRight: '2px solid oklch(0.84 0.012 255)', borderBottom: '1px solid oklch(0.95 0.005 255)', padding: dens.pad, textAlign: 'left', fontSize: dens.fz, fontWeight: 500, color: 'oklch(0.42 0.012 255)', whiteSpace: 'nowrap' }">
                  {{ row.label }}
                  <span style="color:oklch(0.66 0.01 255); font-size:9.5px; font-weight:400;">{{ row.unit }}</span>
                </th>
                <td
                  v-for="(cell, ci) in row.cells"
                  :key="ci"
                  :style="{ borderBottom: '1px solid oklch(0.96 0.004 255)', borderLeft: cell.sideBorder, background: cell.bg, padding: dens.cellPad, textAlign: 'center' }"
                >
                  <div v-if="cell.isWind" style="display:flex; align-items:center; justify-content:center; gap:2px;">
                    <span :style="{ fontSize: '10px', lineHeight: 1, color: 'oklch(0.45 0.03 255)', transform: `rotate(${cell.deg}deg)` }">↑</span>
                    <span :style="{ fontFamily: 'IBM Plex Mono, monospace', fontSize: dens.fz, fontWeight: cell.weight, color: cell.color }">{{ cell.main }}</span>
                  </div>
                  <span v-if="cell.isText" :style="{ fontFamily: 'IBM Plex Mono, monospace', fontSize: dens.fz, fontWeight: cell.weight, color: cell.color }">{{ cell.main }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div style="font-size:11px; color:oklch(0.55 0.01 255); margin-top:10px;">{{ props.t.obsNote }}</div>
  </div>
</template>
