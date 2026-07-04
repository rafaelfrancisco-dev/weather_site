<script setup lang="ts">
import type { ChartData, ChartOptions } from 'chart.js'
import { Bar } from 'vue-chartjs'
import type { MeteogramModel } from '~/utils/charts'
import { tempColor } from '~/utils/colors'
import {
  chartAxisBorderColor,
  chartGridColor,
  chartTicks,
  dayBoundsPlugin,
  nowLinePlugin,
  tooltipOptions,
} from '~/utils/chartTheme'
const props = defineProps<{
  model: MeteogramModel
  mobile: boolean
  primary: string
  t: Record<string, string>
}>()

const settings = useSettings()

const PRECIP_BAR_COLOR = 'oklch(0.55 0.13 250 / 0.35)'

const chartData = computed(() => ({
  labels: props.model.labels,
  datasets: [
    {
      type: 'line',
      label: props.t.temp,
      data: props.model.temp,
      yAxisID: 'yTemp',
      tension: 0.35,
      pointRadius: 0,
      borderWidth: 2,
      borderColor: 'oklch(0.32 0.012 255)',
      segment: { borderColor: (ctx: { p1: { parsed: { y: number } } }) => tempColor(ctx.p1.parsed.y) },
    },
    {
      type: 'line',
      label: props.t.feels,
      data: props.model.feels,
      yAxisID: 'yTemp',
      tension: 0.35,
      pointRadius: 0,
      borderWidth: 1.5,
      borderColor: props.primary,
      borderDash: [4, 3],
      spanGaps: true,
    },
    {
      type: 'bar',
      label: props.t.precipProb,
      data: props.model.precip,
      yAxisID: 'yPrecip',
      backgroundColor: PRECIP_BAR_COLOR,
      borderWidth: 0,
    },
  ],
  // vue-chartjs's Bar wrapper types data as ChartData<'bar'>, which can't
  // express mixed line+bar datasets — one contained cast is the standard
  // vue-chartjs workaround.
}) as unknown as ChartData<'bar'>)

const chartOptions = computed(() => ({
  animation: false,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  layout: { padding: { top: 18 } },
  scales: {
    x: {
      ticks: { ...chartTicks, maxRotation: 0, autoSkipPadding: 8 },
      grid: { display: false },
      border: { color: chartAxisBorderColor },
    },
    yTemp: {
      position: 'left',
      suggestedMin: props.model.tempSuggestedMin,
      suggestedMax: props.model.tempSuggestedMax,
      ticks: { ...chartTicks, callback: (v: number | string) => `${v}°` },
      grid: { color: chartGridColor },
      border: { color: chartAxisBorderColor },
    },
    yPrecip: {
      position: 'right',
      min: 0,
      max: 100,
      ticks: { ...chartTicks, callback: (v: number | string) => `${v}%` },
      grid: { display: false },
      border: { color: chartAxisBorderColor },
    },
  },
  plugins: {
    tooltip: {
      ...tooltipOptions(),
      callbacks: {
        label: (item: { dataset: { label?: string, yAxisID?: string }, parsed: { y: number | null } }) =>
          `${item.dataset.label}: ${item.parsed.y ?? '—'}${item.dataset.yAxisID === 'yPrecip' ? '%' : '°'}`,
      },
    },
    nowLine: { index: props.model.nowIndex },
    dayBounds: { bounds: props.model.dayBounds },
  },
  // Custom plugin option keys (nowLine, dayBounds) aren't part of the chart.js
  // option types — contained cast, same rationale as chartData above.
}) as unknown as ChartOptions<'bar'>)

const chartPlugins = [nowLinePlugin, dayBoundsPlugin]

const desktopHeight = computed(() => settings.value.density === 'Compact' ? '190px' : '220px')

const legendItems = computed(() => [
  { label: props.t.temp, swatch: { width: '14px', borderTop: '2px solid oklch(0.32 0.012 255)' } },
  { label: props.t.feels, swatch: { width: '14px', borderTop: `2px dashed ${props.primary}` } },
  { label: props.t.precipProb, swatch: { width: '8px', height: '8px', borderRadius: '2px', background: PRECIP_BAR_COLOR } },
])
</script>

<template>
  <div style="border:1px solid oklch(0.89 0.008 255); border-radius:7px; background:#fff; padding:10px 12px;">
    <div style="display:flex; align-items:center; gap:14px; margin-bottom:6px;">
      <span
        v-for="item in legendItems"
        :key="item.label"
        style="display:inline-flex; align-items:center; gap:5px; font-size:11px; color:var(--text-muted);"
      >
        <span :style="{ display: 'inline-block', ...item.swatch }"></span>{{ item.label }}
      </span>
    </div>
    <div v-if="props.mobile" style="overflow-x:auto; -webkit-overflow-scrolling:touch;">
      <div style="width:720px; height:180px; position:relative;">
        <Bar :data="chartData" :options="chartOptions" :plugins="chartPlugins" />
      </div>
    </div>
    <div v-else :style="{ height: desktopHeight, position: 'relative' }">
      <Bar :data="chartData" :options="chartOptions" :plugins="chartPlugins" />
    </div>
  </div>
</template>
