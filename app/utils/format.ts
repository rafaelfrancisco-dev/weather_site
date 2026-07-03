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

// Zoneless forecast timestamps (e.g. "2026-07-03T18:00:00") are IPMA's local
// wall-clock strings, not UTC instants — appending "Z" anchors the same digits
// as a UTC instant so they can be diffed against a wall-clock "now" (see
// wallClockMs) without either side being skewed by the parsing environment's TZ.
export function wallParseMs(isoLocal: string): number {
  return isoLocal.includes('T') ? Date.parse(`${isoLocal}Z`) : Date.parse(isoLocal)
}

const wallClockFormatters = new Map<string, Intl.DateTimeFormat>()

function wallClockFormatterFor(timeZone: string): Intl.DateTimeFormat {
  let dtf = wallClockFormatters.get(timeZone)
  if (!dtf) {
    dtf = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    wallClockFormatters.set(timeZone, dtf)
  }
  return dtf
}

// Expresses a real instant (ms) as that zone's wall-clock digits, re-anchored
// as if they were UTC — the same encoding wallParseMs uses for forecast
// strings, so the two can be compared directly regardless of server/client TZ.
export function wallClockMs(ms: number, timeZone: string): number {
  const parts = wallClockFormatterFor(timeZone).formatToParts(new Date(ms))
  const get = (type: string) => Number(parts.find(p => p.type === type)?.value)
  const hour = get('hour') % 24
  return Date.UTC(get('year'), get('month') - 1, get('day'), hour, get('minute'), get('second'))
}

export function isDaytimeAtWallMs(wallMs: number): boolean {
  const h = new Date(wallMs).getUTCHours()
  return h >= 7 && h < 20
}

export function weatherIconUrl(weatherTypeID: number, day: boolean): string {
  const timeOfDay = day ? 'd' : 'n'
  const padded = String(weatherTypeID).padStart(2, '0')
  return `https://www.ipma.pt/bin/icons/svg/weather/w_ic_${timeOfDay}_${padded}.svg`
}
