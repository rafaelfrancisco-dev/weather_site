import type { Lang } from '~/utils/i18n'
import { monthShort } from '~/utils/i18n'

const DIRS: Record<string, number> = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 }

export function windArrowDeg(dir: string | null | undefined): number {
  if (!dir) return 180
  return (DIRS[dir] ?? 0) + 180
}

export function coordString(lat: number, lon: number): string {
  return `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'} ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`
}

export function hourLabel(isoDate: string): string {
  return String(new Date(isoDate).getHours()).padStart(2, '0')
}

export function dateKey(isoDate: string): string {
  const d = new Date(isoDate)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

export function dateTimeLabel(date: Date, lang: Lang): string {
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${date.getDate()} ${monthShort(date, lang)}, ${hh}:${mm}`
}

export function isDaytime(isoDate: string): boolean {
  const h = new Date(isoDate).getHours()
  return h >= 7 && h < 20
}

export function weatherIconUrl(weatherTypeID: number, day: boolean): string {
  const timeOfDay = day ? 'd' : 'n'
  const padded = String(weatherTypeID).padStart(2, '0')
  return `https://www.ipma.pt/bin/icons/svg/weather/w_ic_${timeOfDay}_${padded}.svg`
}
