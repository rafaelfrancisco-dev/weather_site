// Chart.js registration + shared theme for all chart components. Canvas 2D
// accepts OKLCH color strings directly, so the palette helpers in colors.ts
// are reused as-is. Module-level registration evaluates once per bundle.
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import type { Plugin } from 'chart.js'

// Legend is deliberately not registered — legends are rendered as HTML rows
// above the charts, which matches the app's typographic design better than
// Chart.js's canvas legend. No Title, no time scale/date adapter either:
// category axes get preformatted labels from the i18n helpers.
Chart.register(
  LineController,
  BarController,
  LineElement,
  PointElement,
  BarElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler,
)

export const CHART_FONT_MONO = '\'IBM Plex Mono\', monospace'
export const CHART_FONT_SANS = '\'IBM Plex Sans\', sans-serif'

export const chartTicks = {
  color: 'oklch(0.5 0.01 255)',
  font: { family: CHART_FONT_MONO, size: 11 },
}

export const chartGridColor = 'oklch(0.94 0.006 255)'
export const chartAxisBorderColor = 'oklch(0.89 0.008 255)'

export function tooltipOptions() {
  return {
    backgroundColor: '#fff',
    borderColor: 'oklch(0.89 0.008 255)',
    borderWidth: 1,
    cornerRadius: 7,
    titleColor: 'oklch(0.28 0.012 255)',
    titleFont: { family: CHART_FONT_SANS, size: 11.5, weight: 600 as const },
    bodyColor: 'oklch(0.4 0.012 255)',
    bodyFont: { family: CHART_FONT_MONO, size: 11.5 },
    padding: 8,
    boxWidth: 8,
    boxHeight: 8,
    boxPadding: 3,
  }
}

// Vertical "now" marker — same color as the hourly grid's current-hour border.
// No-op when options.plugins.nowLine.index is absent.
export const nowLinePlugin: Plugin = {
  id: 'nowLine',
  afterDatasetsDraw(chart) {
    const opts = (chart.options.plugins as { nowLine?: { index?: number } } | undefined)?.nowLine
    if (opts?.index == null || opts.index < 0) return
    const x = chart.scales.x?.getPixelForValue(opts.index)
    if (x == null || Number.isNaN(x)) return
    const { top, bottom } = chart.chartArea
    const ctx = chart.ctx
    ctx.save()
    ctx.strokeStyle = 'oklch(0.65 0.02 255)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(x, top)
    ctx.lineTo(x, bottom)
    ctx.stroke()
    ctx.restore()
  },
}

// Day separators + in-canvas day labels — mirrors the hourly grid's day
// headers. No-op when options.plugins.dayBounds.bounds is absent.
export const dayBoundsPlugin: Plugin = {
  id: 'dayBounds',
  afterDatasetsDraw(chart) {
    const opts = (chart.options.plugins as { dayBounds?: { bounds?: { index: number, label: string }[] } } | undefined)?.dayBounds
    const bounds = opts?.bounds
    if (!bounds?.length) return
    const { top, bottom } = chart.chartArea
    const ctx = chart.ctx
    ctx.save()
    for (const b of bounds) {
      const x = chart.scales.x?.getPixelForValue(b.index)
      if (x == null || Number.isNaN(x)) continue
      if (b.index > 0) {
        ctx.strokeStyle = 'oklch(0.85 0.01 255)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x, top)
        ctx.lineTo(x, bottom)
        ctx.stroke()
      }
      ctx.fillStyle = 'oklch(0.45 0.012 255)'
      ctx.font = `600 11px ${CHART_FONT_SANS}`
      ctx.textAlign = 'left'
      ctx.textBaseline = 'bottom'
      ctx.fillText(b.label, x + 4, top - 4)
    }
    ctx.restore()
  },
}
