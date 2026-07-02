export type AccentTheme = 'Institutional blue' | 'Teal' | 'Slate'
export type WarningLevel = 'green' | 'yellow' | 'orange' | 'red'

export function accentColors(theme: AccentTheme) {
  if (theme === 'Teal') {
    return { primary: 'oklch(0.50 0.085 200)', soft: 'oklch(0.95 0.03 200)', headerBg: 'oklch(0.36 0.06 205)' }
  }
  if (theme === 'Slate') {
    return { primary: 'oklch(0.42 0.03 255)', soft: 'oklch(0.95 0.012 255)', headerBg: 'oklch(0.30 0.025 255)' }
  }
  return { primary: 'oklch(0.50 0.12 255)', soft: 'oklch(0.955 0.03 255)', headerBg: 'oklch(0.36 0.09 258)' }
}

export function tempBg(t: number): string {
  if (t <= 8) return 'oklch(0.94 0.045 250)'
  if (t <= 13) return 'oklch(0.955 0.03 235)'
  if (t <= 18) return 'oklch(0.97 0.02 200)'
  if (t <= 22) return 'transparent'
  if (t <= 26) return 'oklch(0.965 0.035 80)'
  if (t <= 30) return 'oklch(0.94 0.06 62)'
  if (t <= 34) return 'oklch(0.91 0.085 48)'
  return 'oklch(0.87 0.11 35)'
}

export function tempColor(t: number): string {
  if (t <= 10) return 'oklch(0.48 0.13 250)'
  if (t >= 30) return 'oklch(0.52 0.18 35)'
  if (t >= 25) return 'oklch(0.55 0.12 50)'
  return 'oklch(0.32 0.012 255)'
}

export function precipBg(p: number): string {
  if (p <= 0) return 'transparent'
  return `oklch(${0.985 - p * 0.0016} ${p * 0.0011} 250)`
}

export function precipColor(p: number): string {
  if (p <= 5) return 'oklch(0.62 0.01 255)'
  if (p >= 60) return 'oklch(0.45 0.15 255)'
  return 'oklch(0.4 0.012 255)'
}

export function windBg(s: number): string {
  if (s < 20) return 'transparent'
  return `oklch(${0.98 - (s - 20) * 0.003} 0.012 255)`
}

// mapColors.ts's TEMP_STOPS is a hex port of these stops for Mapbox GL paint
// expressions — keep both in sync when adjusting this palette.
export function tempFill(t: number): string {
  if (t <= 6) return 'oklch(0.74 0.13 256)'
  if (t <= 10) return 'oklch(0.80 0.11 250)'
  if (t <= 14) return 'oklch(0.86 0.08 235)'
  if (t <= 18) return 'oklch(0.90 0.06 200)'
  if (t <= 22) return 'oklch(0.90 0.07 140)'
  if (t <= 26) return 'oklch(0.88 0.10 95)'
  if (t <= 30) return 'oklch(0.83 0.13 72)'
  if (t <= 34) return 'oklch(0.74 0.16 50)'
  if (t <= 38) return 'oklch(0.65 0.19 35)'
  return 'oklch(0.55 0.21 27)'
}

export function fireColor(n: number): string {
  const stops = ['', 'oklch(0.78 0.10 150)', 'oklch(0.86 0.11 110)', 'oklch(0.83 0.13 80)', 'oklch(0.72 0.16 52)', 'oklch(0.57 0.20 30)']
  return stops[n] ?? 'oklch(0.9 0.01 255)'
}

export function waveFill(h: number): string {
  if (h < 1.5) return 'oklch(0.88 0.05 220)'
  if (h < 2.5) return 'oklch(0.78 0.09 235)'
  if (h < 3.5) return 'oklch(0.66 0.12 250)'
  if (h < 4.5) return 'oklch(0.55 0.15 262)'
  return 'oklch(0.45 0.16 270)'
}

export function uvColor(uv: number): string {
  if (uv < 3) return 'oklch(0.62 0.13 150)'
  if (uv < 6) return 'oklch(0.78 0.14 90)'
  if (uv < 8) return 'oklch(0.70 0.16 58)'
  if (uv < 11) return 'oklch(0.55 0.21 27)'
  return 'oklch(0.45 0.2 320)'
}

const LEVEL_COLORS: Record<WarningLevel, string> = {
  green: 'oklch(0.62 0.13 150)',
  yellow: 'oklch(0.80 0.14 90)',
  orange: 'oklch(0.70 0.16 58)',
  red: 'oklch(0.55 0.21 27)'
}

const LEVEL_SOFT: Record<WarningLevel, string> = {
  green: 'oklch(0.96 0.04 150)',
  yellow: 'oklch(0.97 0.05 90)',
  orange: 'oklch(0.96 0.05 58)',
  red: 'oklch(0.96 0.05 27)'
}

const LEVEL_LABEL: Record<WarningLevel, { en: string, pt: string }> = {
  green: { en: 'Green', pt: 'Verde' },
  yellow: { en: 'Yellow', pt: 'Amarelo' },
  orange: { en: 'Orange', pt: 'Laranja' },
  red: { en: 'Red', pt: 'Vermelho' }
}

const LEVEL_RANK: Record<WarningLevel, number> = {
  green: 1,
  yellow: 2,
  orange: 3,
  red: 4
}

export function levelColor(l: WarningLevel): string {
  return LEVEL_COLORS[l]
}

export function levelSoft(l: WarningLevel): string {
  return LEVEL_SOFT[l]
}

export function levelLabelTxt(l: WarningLevel, lang: 'en' | 'pt'): string {
  return LEVEL_LABEL[l][lang]
}

export function levelRank(l: WarningLevel): number {
  return LEVEL_RANK[l] ?? 0
}
