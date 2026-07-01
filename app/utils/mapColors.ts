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

// Same TEMP_STOPS gradient as mapboxTempColor(), expressed as a Mapbox GL "interpolate" input
// array so a paint expression can reuse it directly (e.g. coloring a cluster by average temp)
export function mapboxTempColorStops(): (number | string)[] {
  return TEMP_STOPS.flatMap(([stop, color]) => [stop, color])
}

// text-safe temperature color (saturated, legible on white/light basemap) — hex port of
// colors.ts's tempColor(), distinct from the softer mapboxTempColor()/tempFill() used for fills
export function mapboxTempTextColor(t: number): string {
  if (t <= 10) return '#2f6fb0'
  if (t >= 30) return '#c8412a'
  if (t >= 25) return '#c07830'
  return '#1e2a3a'
}

// contrast-picked label color for a value drawn on top of a colored dot (observations)
export function mapboxObsValueColor(t: number): string {
  return (t >= 30 || t <= 8) ? '#ffffff' : '#1e2a3a'
}

// contrast-picked label color for a value drawn on top of a colored dot (uv)
export function mapboxUvValueColor(uv: number): string {
  return (uv >= 6 || uv < 3) ? '#ffffff' : '#1e2a3a'
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

// contrast-picked text color for a district warning label sitting on its level-colored fill —
// yellow fills are light enough to need dark text, the rest read fine in white
export function mapboxWarningTextColor(level: 'green' | 'yellow' | 'orange' | 'red'): string {
  return level === 'yellow' ? '#4a3c10' : '#ffffff'
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

// contrast-picked text/halo for a fire-risk label sitting on its risk-colored fill —
// the top two tiers (4-5) are dark enough to need white text with a dark halo
export function mapboxFireTextColor(n: number): string {
  return n >= 4 ? '#ffffff' : '#1e2a3a'
}

export function mapboxFireHaloColor(n: number): string {
  return n >= 4 ? 'rgba(60,20,10,0.55)' : '#ffffff'
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
