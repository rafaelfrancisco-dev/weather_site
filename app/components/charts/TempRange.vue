<script setup lang="ts">
import type { ChartData, ChartOptions } from 'chart.js'
import { Line } from 'vue-chartjs'
import type { DailyRangeModel } from '~/utils/charts'
import {
  chartAxisBorderColor,
  chartGridColor,
  chartTicks,
  tooltipOptions,
  tooltipTitleCallback,
} from '~/utils/chartTheme'

const props = defineProps<{
  model: DailyRangeModel
  mobile: boolean
  t: Record<string, string>
}>()

const settings = useSettings()

const MAX_LINE_COLOR = 'oklch(0.55 0.12 50)'
const MIN_LINE_COLOR = 'oklch(0.48 0.13 250)'
const BAND_FILL = 'oklch(0.75 0.10 60 / 0.18)'

const chartData = computed<ChartData<'line'>>(() => ({
  labels: props.model.labels,
  datasets: [
    {
      label: props.t.maxLabel,
      data: props.model.tMax,
      borderColor: MAX_LINE_COLOR,
      backgroundColor: BAND_FILL,
      tension: 0.35,
      pointRadius: 2,
      pointBackgroundColor: MAX_LINE_COLOR,
      borderWidth: 2,
    },
    {
      label: props.t.minLabel,
      data: props.model.tMin,
      borderColor: MIN_LINE_COLOR,
      backgroundColor: BAND_FILL,
      tension: 0.35,
      pointRadius: 2,
      pointBackgroundColor: MIN_LINE_COLOR,
      borderWidth: 2,
      // Fill up to the previous dataset (tMax) → min/max band.
      fill: '-1',
    },
  ],
}))

const chartOptions = computed(() => ({
  animation: false,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  scales: {
    x: {
      ticks: { ...chartTicks, maxRotation: 0 },
      grid: { display: false },
      border: { color: chartAxisBorderColor },
    },
    y: {
      suggestedMin: props.model.suggestedMin,
      suggestedMax: props.model.suggestedMax,
      ticks: { ...chartTicks, callback: (v: number | string) => `${v}°` },
      grid: { color: chartGridColor },
      border: { color: chartAxisBorderColor },
    },
  },
  plugins: {
    tooltip: {
      ...tooltipOptions(),
      callbacks: {
        title: tooltipTitleCallback(props.model.fullLabels),
        label: (item: { dataset: { label?: string }, parsed: { y: number | null } }) =>
          `${item.dataset.label}: ${item.parsed.y ?? '—'}°`,
      },
    },
  },
}) as unknown as ChartOptions<'line'>)

const height = computed(() => {
  if (props.mobile) return '170px'
  return settings.value.density === 'Compact' ? '170px' : '200px'
})
</script>

<template>
  <div style="border:1px solid oklch(0.89 0.008 255); border-radius:7px; background:#fff; padding:10px 12px;">
    <div style="display:flex; align-items:center; gap:14px; margin-bottom:6px;">
      <span style="display:inline-flex; align-items:center; gap:5px; font-size:11px; color:var(--text-muted);">
        <span :style="{ display: 'inline-block', width: '14px', borderTop: `2px solid ${MAX_LINE_COLOR}` }"></span>{{ props.t.maxLabel }}
      </span>
      <span style="display:inline-flex; align-items:center; gap:5px; font-size:11px; color:var(--text-muted);">
        <span :style="{ display: 'inline-block', width: '14px', borderTop: `2px solid ${MIN_LINE_COLOR}` }"></span>{{ props.t.minLabel }}
      </span>
    </div>
    <div :style="{ height, position: 'relative' }">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>
