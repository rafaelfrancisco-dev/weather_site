import type {
  JSStation,
  JSStationObservation,
} from '#shared/ipma-types'
import { precipBg, precipColor, tempBg, tempColor, windBg } from '~/utils/colors'
import { hourLabel } from '~/utils/format'
import type { Lang } from '~/utils/i18n'

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

function nearestStationsWithObservations(
  stations: JSStation[],
  observations: JSStationObservation[],
  lat: number,
  lon: number,
  count: number,
): JSStation[] {
  const stationIds = new Set(observations.map(o => o.stationID))
  return stations
    .filter(s => stationIds.has(s.id))
    .slice()
    .sort((a, b) => {
      const da = haversineKm(lat, lon, a.latitude, a.longitude)
      const db = haversineKm(lat, lon, b.latitude, b.longitude)
      return da - db
    })
    .slice(0, count)
}

export interface ObservationGridCell {
  isWind: boolean
  isText: boolean
  main: string
  deg: number
  weight: number
  color: string
  bg: string
  sideBorder: string
}

export interface ObservationGridRow {
  first: boolean
  station: string
  stationRowspan: number
  stationBg: string
  labelBg: string
  label: string
  unit: string
  cells: ObservationGridCell[]
  topBorder: string
}

export interface ObservationStationCard {
  name: string
  latestLabel: string
  rows: { label: string, unit: string, cells: ObservationGridCell[] }[]
}

export interface ObservationGrid {
  rows: ObservationGridRow[]
  stationCards: ObservationStationCard[]
  timeCols: { label: string, bg: string, weight: number, color: string }[]
  summary: string
  stationLabel: string
  paramLabel: string
  timeLabel: string
}

function emptyObservationGrid(lang: Lang): ObservationGrid {
  return {
    rows: [],
    stationCards: [],
    timeCols: [],
    summary: lang === 'pt' ? 'Sem observações disponíveis' : 'No observations available',
    stationLabel: lang === 'pt' ? 'Estação' : 'Station',
    paramLabel: lang === 'pt' ? 'Parâmetro' : 'Parameter',
    timeLabel: lang === 'pt' ? 'Hora' : 'Time',
  }
}

function humidityBg(h: number): string {
  if (h < 70) return 'transparent'
  return `oklch(${0.99 - (h - 70) * 0.001} 0.01 220)`
}

function round1(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1)
}

// IPMA station observation times come back with no zone info (e.g.
// "2026-07-01T17:00") but represent UTC instants. `new Date()` would parse an
// unqualified string as local time, so append :00Z to make the UTC-ness
// explicit before parsing — this makes timeKeys true instants and lets
// observationTimeLabel's hourLabel() below yield the correct local hour.
function observationTimeKey(value: string): string {
  const hasZoneInfo = /[zZ]|[+-]\d{2}:?\d{2}$/.test(value)
  return new Date(hasZoneInfo ? value : `${value}:00Z`).toISOString()
}

function observationTimeLabel(value: string): string {
  return `${hourLabel(value)}:00`
}

function observationCell(
  key: 'temp' | 'hum' | 'wind' | 'pressure' | 'precip',
  observation: JSStationObservation | undefined,
): Omit<ObservationGridCell, 'sideBorder'> {
  if (!observation) {
    return {
      isWind: false,
      isText: true,
      main: '–',
      deg: 0,
      bg: 'transparent',
      color: 'oklch(0.78 0.01 255)',
      weight: 400,
    }
  }

  if (key === 'temp') {
    return observation.temperature == null
      ? observationCell(key, undefined)
      : { isWind: false, isText: true, main: `${round1(observation.temperature)}°`, deg: 0, bg: tempBg(observation.temperature), color: tempColor(observation.temperature), weight: 600 }
  }
  if (key === 'hum') {
    return observation.humidity == null
      ? observationCell(key, undefined)
      : { isWind: false, isText: true, main: `${round1(observation.humidity)}%`, deg: 0, bg: humidityBg(observation.humidity), color: 'oklch(0.42 0.012 255)', weight: 500 }
  }
  if (key === 'wind') {
    return observation.windSpeedKMH == null
      ? observationCell(key, undefined)
      : { isWind: true, isText: false, main: round1(observation.windSpeedKMH), deg: observation.windDirectionID != null ? observation.windDirectionID * 22.5 + 180 : 180, bg: windBg(observation.windSpeedKMH), color: 'oklch(0.42 0.012 255)', weight: 500 }
  }
  if (key === 'pressure') {
    return observation.pressure == null
      ? observationCell(key, undefined)
      : { isWind: false, isText: true, main: observation.pressure.toFixed(1), deg: 0, bg: 'transparent', color: 'oklch(0.42 0.012 255)', weight: 500 }
  }

  return observation.precipitation == null
    ? observationCell(key, undefined)
    : { isWind: false, isText: true, main: observation.precipitation === 0 ? '0' : observation.precipitation.toFixed(1), deg: 0, bg: precipBg(observation.precipitation * 10), color: precipColor(observation.precipitation * 10), weight: observation.precipitation > 0 ? 600 : 400 }
}

export function buildObservationGrid(
  stations: JSStation[],
  observations: JSStationObservation[],
  lat: number,
  lon: number,
  lang: Lang,
  t: { time: string, temp: string, humidity: string, wind: string, pressure: string, precip: string },
  primaryColor: string,
  softColor: string,
): ObservationGrid {
  const selectedStations = nearestStationsWithObservations(stations, observations, lat, lon, 5)
  if (selectedStations.length === 0) return emptyObservationGrid(lang)

  const selectedIds = new Set(selectedStations.map(s => s.id))
  const scopedObservations = observations.filter(o => selectedIds.has(o.stationID))
  const timeKeys = [...new Set(scopedObservations.map(o => observationTimeKey(o.time)))]
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    .slice(0, 7)
    .reverse()

  if (timeKeys.length === 0) return emptyObservationGrid(lang)

  const lastIdx = timeKeys.length - 1
  const timeCols = timeKeys.map((tm, i) => ({
    label: observationTimeLabel(tm),
    bg: i === lastIdx ? softColor : 'oklch(0.975 0.004 255)',
    weight: i === lastIdx ? 700 : 500,
    color: i === lastIdx ? primaryColor : 'var(--text-muted)',
  }))

  const metricRowDefs: { key: 'temp' | 'hum' | 'wind' | 'pressure' | 'precip', label: string, unit: string }[] = [
    { key: 'temp', label: t.temp, unit: '°C' },
    { key: 'hum', label: t.humidity, unit: '%' },
    { key: 'wind', label: t.wind, unit: 'km/h' },
    { key: 'pressure', label: t.pressure, unit: 'hPa' },
    { key: 'precip', label: t.precip, unit: 'mm' },
  ]

  const observationsByStationTime = new Map<string, JSStationObservation>()
  for (const observation of scopedObservations) {
    const key = `${observation.stationID}:${observationTimeKey(observation.time)}`
    observationsByStationTime.set(key, observation)
  }

  const rows: ObservationGridRow[] = []
  const stationCards: ObservationStationCard[] = []
  const nMetrics = metricRowDefs.length
  selectedStations.forEach((station, si) => {
    const stationBg = si % 2 === 0 ? 'oklch(0.972 0.006 255)' : 'oklch(0.962 0.008 255)'
    const labelBg = si % 2 === 0 ? '#fff' : 'oklch(0.986 0.003 255)'
    const cardRows: { label: string, unit: string, cells: ObservationGridCell[] }[] = []
    metricRowDefs.forEach((metric, mi) => {
      const cells = timeKeys.map((timeKey, ci) => {
        const latest = ci === lastIdx
        const base = observationCell(metric.key, observationsByStationTime.get(`${station.id}:${timeKey}`))
        return {
          ...base,
          bg: latest && base.bg === 'transparent' ? softColor : base.bg,
          sideBorder: latest ? `2px solid ${primaryColor}` : '1px solid oklch(0.95 0.005 255)',
        }
      })

      rows.push({
        first: mi === 0,
        station: station.name,
        stationRowspan: nMetrics,
        stationBg,
        labelBg,
        label: metric.label,
        unit: metric.unit,
        cells,
        topBorder: mi === 0 && si > 0 ? '2px solid oklch(0.84 0.012 255)' : '1px solid oklch(0.95 0.005 255)',
      })

      cardRows.push({ label: metric.label, unit: metric.unit, cells })
    })

    const latestTemp = observationsByStationTime.get(`${station.id}:${timeKeys[lastIdx]}`)?.temperature
    stationCards.push({
      name: station.name,
      latestLabel: latestTemp != null ? `${round1(latestTemp)}°` : '—',
      rows: cardRows,
    })
  })

  return {
    rows,
    stationCards,
    timeCols,
    summary: lang === 'pt'
      ? `${selectedStations.length} estações · ${nMetrics} parâmetros · de hora a hora · ${timeCols[0].label}–${timeCols[lastIdx].label}`
      : `${selectedStations.length} stations · ${nMetrics} parameters · hourly · ${timeCols[0].label}–${timeCols[lastIdx].label}`,
    stationLabel: lang === 'pt' ? 'Estação' : 'Station',
    paramLabel: lang === 'pt' ? 'Parâmetro' : 'Parameter',
    timeLabel: t.time,
  }
}
