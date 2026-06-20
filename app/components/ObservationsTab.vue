<script setup lang="ts">
import type { ObsRow } from '~/utils/transform'

const props = defineProps<{
  obsRows: ObsRow[]
  obsCards: { station: string, time: string, metrics: { k: string, v: string, c: string }[] }[]
  mobile: boolean
  t: Record<string, string>
}>()

const obsCols = computed(() => [
  { label: props.t.station, align: 'left' },
  { label: props.t.time, align: 'center' },
  { label: `${props.t.temp} °C`, align: 'right' },
  { label: `${props.t.humidity} %`, align: 'right' },
  { label: `${props.t.pressure} hPa`, align: 'right' },
  { label: `${props.t.wind} km/h`, align: 'center' },
  { label: `${props.t.precip} mm`, align: 'right' },
  { label: `${props.t.solar} W/m²`, align: 'right' }
])
</script>

<template>
  <div>
    <div style="font-size:13.5px; font-weight:600; color:oklch(0.30 0.012 255); margin-bottom:8px;">{{ props.t.obsTitle }}</div>

    <!-- desktop table -->
    <div v-if="!props.mobile" style="border:1px solid oklch(0.89 0.008 255); border-radius:7px; overflow:hidden; background:#fff;">
      <div style="overflow-x:auto;">
        <table style="border-collapse:collapse; width:100%; min-width:760px;">
          <thead>
            <tr style="background:oklch(0.97 0.005 255);">
              <th
                v-for="(oc, i) in obsCols"
                :key="i"
                :style="{ padding: '8px 10px', fontSize: '10.5px', fontWeight: 600, color: 'oklch(0.5 0.01 255)', borderBottom: '1px solid oklch(0.88 0.008 255)', letterSpacing: '0.03em', textTransform: 'uppercase', textAlign: oc.align, whiteSpace: 'nowrap' }"
              >{{ oc.label }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(o, i) in props.obsRows" :key="i" :style="{ background: o.rowBg }">
              <td style="padding:8px 10px; border-bottom:1px solid oklch(0.94 0.006 255); font-size:12.5px; font-weight:500; color:oklch(0.28 0.012 255); white-space:nowrap;">{{ o.station }}</td>
              <td style="padding:8px 10px; border-bottom:1px solid oklch(0.94 0.006 255); font-family:'IBM Plex Mono',monospace; font-size:12px; color:oklch(0.5 0.01 255); text-align:center;">{{ o.time }}</td>
              <td :style="{ padding: '8px 10px', borderBottom: '1px solid oklch(0.94 0.006 255)', fontFamily: 'IBM Plex Mono, monospace', fontSize: '13px', fontWeight: 600, color: o.tempColor, textAlign: 'right' }">{{ o.temp }}°</td>
              <td style="padding:8px 10px; border-bottom:1px solid oklch(0.94 0.006 255); font-family:'IBM Plex Mono',monospace; font-size:12.5px; color:oklch(0.4 0.012 255); text-align:right;">{{ o.humidity }}%</td>
              <td style="padding:8px 10px; border-bottom:1px solid oklch(0.94 0.006 255); font-family:'IBM Plex Mono',monospace; font-size:12.5px; color:oklch(0.4 0.012 255); text-align:right;">{{ o.pressure }}</td>
              <td style="padding:8px 10px; border-bottom:1px solid oklch(0.94 0.006 255); text-align:center; white-space:nowrap;">
                <span :style="{ display: 'inline-block', fontSize: '12px', color: 'oklch(0.45 0.03 255)', transform: `rotate(${o.deg}deg)`, verticalAlign: 'middle' }">↑</span>
                <span style="font-family:'IBM Plex Mono',monospace; font-size:12px; color:oklch(0.45 0.012 255); margin-left:5px;">{{ o.windKmh }}</span>
              </td>
              <td style="padding:8px 10px; border-bottom:1px solid oklch(0.94 0.006 255); font-family:'IBM Plex Mono',monospace; font-size:12.5px; color:oklch(0.4 0.012 255); text-align:right;">{{ o.precip }}</td>
              <td style="padding:8px 10px; border-bottom:1px solid oklch(0.94 0.006 255); font-family:'IBM Plex Mono',monospace; font-size:12.5px; color:oklch(0.4 0.012 255); text-align:right;">{{ o.solar }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- mobile cards -->
    <div v-if="props.mobile" style="display:flex; flex-direction:column; gap:10px;">
      <div v-for="(oc, i) in props.obsCards" :key="i" style="border:1px solid oklch(0.9 0.006 255); border-radius:10px; background:#fff; padding:12px 14px;">
        <div style="display:flex; align-items:baseline; justify-content:space-between; gap:8px; margin-bottom:9px;">
          <span style="font-size:13.5px; font-weight:600; color:oklch(0.26 0.018 255);">{{ oc.station }}</span>
          <span style="font-family:'IBM Plex Mono',monospace; font-size:11px; color:oklch(0.55 0.01 255);">{{ oc.time }}</span>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px 16px;">
          <div v-for="(m, mi) in oc.metrics" :key="mi" style="display:flex; align-items:baseline; justify-content:space-between; gap:8px; border-bottom:1px solid oklch(0.95 0.005 255); padding-bottom:4px;">
            <span style="font-size:11px; color:oklch(0.5 0.01 255);">{{ m.k }}</span>
            <span :style="{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '12.5px', fontWeight: 500, color: m.c }">{{ m.v }}</span>
          </div>
        </div>
      </div>
    </div>
    <div style="font-size:11px; color:oklch(0.55 0.01 255); margin-top:10px;">{{ props.t.obsNote }}</div>
  </div>
</template>
