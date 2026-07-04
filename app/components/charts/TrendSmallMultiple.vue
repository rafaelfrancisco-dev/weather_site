<script setup lang="ts">
import type { ChartData, ChartOptions } from 'chart.js'
import { Line } from 'vue-chartjs'
import type { ObservationChartSeries } from '~/utils/observationTransform'
import {
  chartAxisBorderColor,
  chartGridColor,
  chartTicks,
  tooltipOptions,
} from '~/utils/chartTheme'

const props = defineProps<{
  title: string
  unit: string
  labels: string[]
  series: ObservationChartSeries[]
  mobile: boolean
}>()

const chartData = computed<ChartData<'line'>>(() => ({
  labels: props.labels,
  datasets: props.series.map(s => ({
    label: s.name,
    data: s.points,
    borderColor: s.color,
    backgroundColor: s.color,
    tension: 0.3,
    // With ~7 points per series, dots read better than bare lines.
    pointRadius: 2,
    borderWidth: 1.5,
    spanGaps: true,
  })),
}))

const chartOptions = computed(() => ({
  animation: false,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  scales: {
    x: {
      ticks: { ...chartTicks, maxRotation: 0, autoSkipPadding: 8 },
      grid: { display: false },
      border: { color: chartAxisBorderColor },
    },
    y: {
      // Auto range with headroom — pressure hovers around 1013 hPa and must
      // not force a zero baseline.
      grace: '10%',
      ticks: chartTicks,
      grid: { color: chartGridColor },
      border: { color: chartAxisBorderColor },
    },
  },
  plugins: {
    tooltip: {
      ...tooltipOptions(),
      callbacks: {
        label: (item: { dataset: { label?: string }, parsed: { y: number | null } }) =>
          `${item.dataset.label}: ${item.parsed.y ?? '—'} ${props.unit}`,
      },
    },
  },
}) as unknown as ChartOptions<'line'>)
</script>

<template>
  <div style="border:1px solid oklch(0.89 0.008 255); border-radius:7px; background:#fff; padding:10px 12px;">
    <div style="font-size:12px; font-weight:600; color:var(--text-heading); margin-bottom:6px;">
      {{ props.title }}
      <span style="color:oklch(0.62 0.01 255); font-size:10.5px; font-weight:400;">{{ props.unit }}</span>
    </div>
    <div style="height:150px; position:relative;">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>
