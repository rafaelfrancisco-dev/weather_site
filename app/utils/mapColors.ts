import type { AccentTheme } from '~/utils/colors'

function lerpHex(c0: string, c1: string, t: number): string {
  const h = (c: string, o: number) => parseInt(c.slice(o, o + 2), 16)
  const r = Math.round(h(c0, 1) + (h(c1, 1) - h(c0, 1)) * t)
  const g = Math.round(h(c0, 3) + (h(c1, 3) - h(c0, 3)) * t)
  const b = Math.round(h(c0, 5) + (h(c1, 5) - h(c0, 5)) * t)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function interpolateStops(stops: [number, string][], t: number): string {
  if (t <= stops[0][0]) return stops[0][1]
  if (t >= stops[stops.length - 1][0]) return stops[stops.length - 1][1]
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [t0, c0] = stops[i - 1]
      const [t1, c1] = stops[i]
      return lerpHex(c0, c1, (t - t0) / (t1 - t0))
    }
  }
  return stops[0][1]
}

// RdBu-inspired diverging palette cold → hot
const TEMP_STOPS: [number, string][] = [
  [-5, '#2166ac'],
  [0,  '#4393c3'],
  [8,  '#92c5de'],
  [14, '#d1e5f0'],
  [18, '#fddbc7'],
  [22, '#f4a582'],
  [26, '#d6604d'],
  [30, '#b2182b'],
  [38, '#67001f'],
]

export function mapboxTempColor(t: number): string {
  return interpolateStops(TEMP_STOPS, t)
}

export function mapboxLevelColor(level: 'green' | 'yellow' | 'orange' | 'red'): string {
  const map: Record<string, string> = {
    green:  '#3a9e5a',
    yellow: '#c8b000',
    orange: '#cc7a00',
    red:    '#c83820',
  }
  return map[level] ?? '#3a9e5a'
}

export function mapboxAccentColor(theme: AccentTheme): string {
  if (theme === 'Teal') return '#108080'
  if (theme === 'Slate') return '#4e5e7a'
  return '#3a6eb8'
}

// Fire risk 1–5 (green → red)
export function mapboxFireColor(n: number): string {
  const stops: Record<number, string> = {
    1: '#4caf73',
    2: '#a8c040',
    3: '#e8a020',
    4: '#e06020',
    5: '#c82010',
  }
  return stops[n] ?? '#ccc'
}

// Wave height in metres (light → deep blue)
export function mapboxWaveColor(h: number): string {
  const stops: [number, string][] = [
    [0,   '#a8daf0'],
    [1.5, '#60b8e0'],
    [2.5, '#2888c8'],
    [3.5, '#1464a8'],
    [4.5, '#0a4080'],
  ]
  return interpolateStops(stops, h)
}

// UV index (green → yellow → orange → red → purple)
export function mapboxUvColor(uv: number): string {
  if (uv < 3)  return '#4caf73'
  if (uv < 6)  return '#f0c020'
  if (uv < 8)  return '#e07820'
  if (uv < 11) return '#c83010'
  return '#983890'
}

export const HEATMAP_COLOR_STOPS: [number, string][] = [
  [0,   'rgba(33,102,172,0)'],
  [0.2, '#4393c3'],
  [0.4, '#92c5de'],
  [0.6, '#f4a582'],
  [0.8, '#d6604d'],
  [1,   '#b2182b'],
]
