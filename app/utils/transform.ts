import type { Lang } from '~/utils/i18n'
import { weekday, monthShort } from '~/utils/i18n'
import { tempColor, tempBg, precipColor, precipBg, windBg, uvColor, levelColor, levelSoft, levelLabelTxt, levelRank } from '~/utils/colors'
import type { WarningLevel } from '~/utils/colors'
import { windArrowDeg, hourLabel, dateKey, isDaytime, dateTimeLabel } from '~/utils/format'
import type {
  JSLocation,
  JSDistrict,
  JSWeatherWarning,
  JSAggregateForecastDay,
  JSHourlyForecastPeriod,
  JSStation,
  JSStationObservation,
  JSLookupDescription
} from '#shared/ipma-types'

const REGION_LABELS: Record<number, { en: string, pt: string }> = {
  1: { en: 'Mainland', pt: 'Continente' },
  2: { en: 'Madeira', pt: 'Madeira' },
  3: { en: 'Azores', pt: 'Açores' }
}

export function regionLabel(regionID: number, lang: Lang): string {
  const entry = REGION_LABELS[regionID]
  return entry ? entry[lang] : `Region ${regionID}`
}

export function isWarningActive(w: JSWeatherWarning, now = new Date()): boolean {
  const start = new Date(w.startTime).getTime()
  const end = new Date(w.endTime).getTime()
  return now.getTime() >= start && now.getTime() <= end
}

export function normalizeLevel(w: JSWeatherWarning): WarningLevel {
  const raw = (w.awarenessLevelID || w.level || 'green').toLowerCase()
  if (raw === 'yellow' || raw === 'orange' || raw === 'red' || raw === 'green') return raw
  return 'green'
}

export function createLabelLookup(descriptions: JSLookupDescription[]) {
  const map = new Map(descriptions.map(d => [d.id, d]))
  return (id: number, lang: Lang): string => {
    const entry = map.get(id)
    if (!entry) return `Type ${id}`
    return lang === 'pt' ? entry.descriptionPT : entry.descriptionEN
  }
}

export interface TreeLocation {
  id: number
  name: string
  selected: boolean
  warn: boolean
  warnColor: string
}

export interface TreeGroup {
  id: string
  name: string
  open: boolean
  caret: number
  locs: TreeLocation[]
  warnCount: number
  warnColor: string
}

function groupKeyFor(loc: JSLocation, districtMap: Map<number, JSDistrict>, lang: Lang): { key: string, name: string, tier: number } {
  if (loc.regionID === 1) {
    const district = districtMap.get(loc.districtID)
    return { key: `d-${loc.districtID}`, name: district?.name ?? `District ${loc.districtID}`, tier: 0 }
  }
  return { key: `r-${loc.regionID}`, name: regionLabel(loc.regionID, lang), tier: loc.regionID }
}

export function buildLocationTree(
  locations: JSLocation[],
  districtMap: Map<number, JSDistrict>,
  warningsByArea: Map<string, JSWeatherWarning[]>,
  selectedId: number | null,
  openMap: Record<string, boolean>,
  query: string,
  lang: Lang
): TreeGroup[] {
  const q = query.trim().toLowerCase()
  const groups = new Map<string, { name: string, tier: number, locs: JSLocation[] }>()
  for (const loc of locations) {
    if (q && !loc.name.toLowerCase().includes(q)) continue
    const { key, name, tier } = groupKeyFor(loc, districtMap, lang)
    if (!groups.has(key)) groups.set(key, { name, tier, locs: [] })
    groups.get(key)!.locs.push(loc)
  }

  const keys = [...groups.keys()].sort((a, b) => {
    const ga = groups.get(a)!
    const gb = groups.get(b)!
    if (ga.tier !== gb.tier) return ga.tier - gb.tier
    return ga.name.localeCompare(gb.name)
  })

  return keys.map((key) => {
    const group = groups.get(key)!
    const locs = group.locs.slice().sort((a, b) => a.name.localeCompare(b.name))
    let warnMax = 0
    let warnMaxLevel: WarningLevel = 'green'
    let warnCount = 0

    const treeLocs: TreeLocation[] = locs.map((loc) => {
      const warnings = (warningsByArea.get(loc.warningAreaID) || []).filter(w => isWarningActive(w))
      let lvl: WarningLevel = 'green'
      let rank = 0
      for (const w of warnings) {
        const level = normalizeLevel(w)
        if (level === 'green') continue
        if (levelRank(level) > rank) {
          rank = levelRank(level)
          lvl = level
        }
      }
      if (rank > 0) warnCount++
      if (rank > warnMax) {
        warnMax = rank
        warnMaxLevel = lvl
      }
      return {
        id: loc.id,
        name: loc.name,
        selected: loc.id === selectedId,
        warn: rank > 0,
        warnColor: rank > 0 ? levelColor(lvl) : 'transparent'
      }
    })

    const containsSelected = selectedId !== null && treeLocs.some(l => l.id === selectedId)
    const isOpen = openMap[key] !== undefined ? openMap[key] : containsSelected

    return {
      id: key,
      name: group.name,
      open: isOpen,
      caret: isOpen ? 90 : 0,
      locs: treeLocs,
      warnCount,
      warnColor: warnCount > 0 ? levelColor(warnMaxLevel) : 'transparent'
    }
  })
}

export interface LocationMeta {
  name: string
  region: string
  district: string
  coord: string
  updated: string
}

export function buildLocationMeta(
  location: JSLocation,
  district: JSDistrict | undefined,
  dataUpdate: string | null,
  lang: Lang
): LocationMeta {
  const lat = Math.abs(location.latitude).toFixed(2) + '°' + (location.latitude >= 0 ? 'N' : 'S')
  const lon = Math.abs(location.longitude).toFixed(2) + '°' + (location.longitude >= 0 ? 'E' : 'W')
  const updated = dataUpdate ? dateTimeLabel(new Date(dataUpdate), lang) : '—'
  return {
    name: location.name,
    region: regionLabel(location.regionID, lang),
    district: district?.name ?? '—',
    coord: `${lat} ${lon}`,
    updated
  }
}

export interface WarningBanner {
  hasWarn: boolean
  banner: {
    color: string
    soft: string
    level: string
    levelLabel: string
    type: string
    text: string
    window: string
  } | null
}

export function buildWarningBanner(warnings: JSWeatherWarning[], lang: Lang, warningsLabel: string): WarningBanner {
  const active = warnings.filter(w => isWarningActive(w) && normalizeLevel(w) !== 'green')
  if (active.length === 0) return { hasWarn: false, banner: null }

  let top = active[0]
  let topRank = levelRank(normalizeLevel(top))
  for (const w of active) {
    const rank = levelRank(normalizeLevel(w))
    if (rank > topRank) {
      topRank = rank
      top = w
    }
  }

  const level = normalizeLevel(top)
  const fmt = (iso: string) => dateTimeLabel(new Date(iso), lang)

  return {
    hasWarn: true,
    banner: {
      color: levelColor(level),
      soft: levelSoft(level),
      level: levelLabelTxt(level, lang),
      levelLabel: warningsLabel,
      type: top.awarenessTypeName,
      text: top.text,
      window: `${fmt(top.startTime)} – ${fmt(top.endTime)}`
    }
  }
}

export interface DailyRow {
  dow: string
  date: string
  icon: string | null
  wt: string
  tmin: number
  tmax: number
  minColor: string
  maxColor: string
  precipProb: number
  precipColor: string
  deg: number
  windSpeed: string
  uv: string
  uvColor: string
  rowBg: string
}

export function buildDailyRows(
  daily: JSAggregateForecastDay[],
  lang: Lang,
  labelFor: (id: number, lang: Lang) => string,
  iconUrl: (weatherTypeID: number, day: boolean) => string | null
): DailyRow[] {
  return daily.map((d, i) => {
    const date = new Date(d.forecastDate)
    const pp = d.precipitationProbability ?? 0
    return {
      dow: weekday(date, lang),
      date: `${date.getDate()} ${monthShort(date, lang)}`,
      icon: iconUrl(d.weatherTypeID, true),
      wt: labelFor(d.weatherTypeID, lang),
      tmin: d.tMin,
      tmax: d.tMax,
      minColor: tempColor(d.tMin),
      maxColor: tempColor(d.tMax),
      precipProb: pp,
      precipColor: precipColor(pp),
      deg: windArrowDeg(d.windDirection),
      windSpeed: d.windGust != null ? `${d.windGust} km/h` : '—',
      uv: d.uvIndex != null ? String(d.uvIndex) : '—',
      uvColor: d.uvIndex != null ? uvColor(d.uvIndex) : 'oklch(0.85 0.01 255)',
      rowBg: i % 2 === 0 ? '#fff' : 'oklch(0.984 0.003 255)'
    }
  })
}

function groupPeriodsByDay(periods: JSHourlyForecastPeriod[], maxDays: number): JSHourlyForecastPeriod[][] {
  const map = new Map<string, JSHourlyForecastPeriod[]>()
  for (const p of periods) {
    const key = dateKey(p.forecastDate)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(p)
  }
  return [...map.values()].slice(0, maxDays)
}

export interface HourCell {
  sep: string
  isIcon: boolean
  isWind: boolean
  isText: boolean
  bg: string
  main: string
  weight: number
  color: string
  showBar: boolean
  barH: string
  barColor: string
  deg: number
  icon: string | null
  title: string
}

export interface HourlyGrid {
  dayHeaders: { span: number, label: string }[]
  timeCols: { label: string, sep: string }[]
  hourRows: { label: string, unit: string, cells: HourCell[] }[]
  hourDays: { label: string, cells: { time: string, icon: string | null, title: string, temp: number, tempColor: string, pp: number, ppColor: string, deg: number, ws: number | null }[] }[]
}

export function buildHourlyGrid(
  periods: JSHourlyForecastPeriod[],
  lang: Lang,
  t: { weather: string, temp: string, feels: string, precipProb: string, wind: string, windSpd: string, humidity: string },
  labelFor: (id: number, lang: Lang) => string,
  iconUrl: (weatherTypeID: number, day: boolean) => string | null,
  primaryColor: string,
  showBars: boolean
): HourlyGrid {
  const days = groupPeriodsByDay(periods, 3)
  const flat = days.flat()

  const dayBoundaries = new Set<number>()
  let acc = 0
  for (const group of days) {
    dayBoundaries.add(acc)
    acc += group.length
  }

  const dayHeaders = days.map((group) => {
    const d = new Date(group[0].forecastDate)
    return { span: group.length, label: `${weekday(d, lang)} ${d.getDate()} ${monthShort(d, lang)}` }
  })

  const timeCols = flat.map((p, i) => ({
    label: hourLabel(p.forecastDate),
    sep: dayBoundaries.has(i) ? '2px solid oklch(0.85 0.01 255)' : '1px solid oklch(0.95 0.005 255)'
  }))

  const mkCells = (fn: (p: JSHourlyForecastPeriod, i: number) => Partial<HourCell>): HourCell[] => flat.map((p, i) => {
    const base: HourCell = {
      sep: dayBoundaries.has(i) ? '2px solid oklch(0.88 0.01 255)' : '1px solid oklch(0.96 0.004 255)',
      isIcon: false,
      isWind: false,
      isText: false,
      bg: 'transparent',
      main: '',
      weight: 450,
      color: 'oklch(0.3 0.012 255)',
      showBar: false,
      barH: '0%',
      barColor: primaryColor,
      deg: 0,
      icon: null,
      title: ''
    }
    return Object.assign(base, fn(p, i))
  })

  const hourRows = [
    {
      label: t.weather,
      unit: '',
      cells: mkCells(p => ({ isIcon: true, icon: iconUrl(p.weatherTypeID, isDaytime(p.forecastDate)), title: labelFor(p.weatherTypeID, lang) }))
    },
    {
      label: t.temp,
      unit: '°C',
      cells: mkCells(p => ({ isText: true, main: `${p.tMed}°`, bg: tempBg(p.tMed), weight: 600, color: tempColor(p.tMed) }))
    },
    {
      label: t.feels,
      unit: '°C',
      cells: mkCells(p => ({ isText: true, main: p.feelsLike != null ? `${p.feelsLike}°` : '—', color: 'oklch(0.46 0.012 255)' }))
    },
    {
      label: t.precipProb,
      unit: '',
      cells: mkCells((p) => {
        const pp = p.precipitationProbability ?? 0
        return { isText: true, main: pp > 0 ? `${pp}%` : '–', bg: precipBg(pp), color: precipColor(pp), showBar: showBars && pp > 0, barH: `${pp}%`, barColor: 'oklch(0.55 0.13 250)' }
      })
    },
    {
      label: t.wind,
      unit: '',
      cells: mkCells(p => ({ isWind: true, deg: windArrowDeg(p.windDirection), main: p.windDirection }))
    },
    {
      label: t.windSpd,
      unit: 'km/h',
      cells: mkCells((p) => {
        const ws = p.windSpeed
        return { isText: true, main: ws != null ? String(ws) : '—', bg: windBg(ws ?? 0), color: 'oklch(0.4 0.012 255)' }
      })
    },
    {
      label: t.humidity,
      unit: '%',
      cells: mkCells(p => ({ isText: true, main: p.humidity != null ? `${p.humidity}%` : '—', color: 'oklch(0.46 0.012 255)' }))
    }
  ]

  const hourDays = days.map((group) => {
    const d = new Date(group[0].forecastDate)
    return {
      label: `${weekday(d, lang)} ${d.getDate()} ${monthShort(d, lang)}`,
      cells: group.map(p => ({
        time: `${hourLabel(p.forecastDate)}h`,
        icon: iconUrl(p.weatherTypeID, isDaytime(p.forecastDate)),
        title: labelFor(p.weatherTypeID, lang),
        temp: p.tMed,
        tempColor: tempColor(p.tMed),
        pp: p.precipitationProbability ?? 0,
        ppColor: precipColor(p.precipitationProbability ?? 0),
        deg: windArrowDeg(p.windDirection),
        ws: p.windSpeed
      }))
    }
  })

  return { dayHeaders, timeCols, hourRows, hourDays }
}

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
  count: number
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

export interface ObservationGrid {
  rows: ObservationGridRow[]
  timeCols: { label: string, bg: string, weight: number, color: string }[]
  summary: string
  stationLabel: string
  paramLabel: string
  timeLabel: string
}

function emptyObservationGrid(lang: Lang): ObservationGrid {
  return {
    rows: [],
    timeCols: [],
    summary: lang === 'pt' ? 'Sem observações disponíveis' : 'No observations available',
    stationLabel: lang === 'pt' ? 'Estação' : 'Station',
    paramLabel: lang === 'pt' ? 'Parâmetro' : 'Parameter',
    timeLabel: lang === 'pt' ? 'Hora' : 'Time'
  }
}

function humidityBg(h: number): string {
  if (h < 70) return 'transparent'
  return `oklch(${0.99 - (h - 70) * 0.001} 0.01 220)`
}

function round1(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1)
}

function observationTimeKey(value: string): string {
  return new Date(value).toISOString()
}

function observationTimeLabel(value: string): string {
  return `${hourLabel(value)}:00`
}

function observationCell(
  key: 'temp' | 'hum' | 'wind' | 'pressure' | 'precip',
  observation: JSStationObservation | undefined
): Omit<ObservationGridCell, 'sideBorder'> {
  if (!observation) {
    return {
      isWind: false,
      isText: true,
      main: '–',
      deg: 0,
      bg: 'transparent',
      color: 'oklch(0.78 0.01 255)',
      weight: 400
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
  softColor: string
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
    color: i === lastIdx ? primaryColor : 'oklch(0.5 0.01 255)'
  }))

  const metricRowDefs: { key: 'temp' | 'hum' | 'wind' | 'pressure' | 'precip', label: string, unit: string }[] = [
    { key: 'temp', label: t.temp, unit: '°C' },
    { key: 'hum', label: t.humidity, unit: '%' },
    { key: 'wind', label: t.wind, unit: 'km/h' },
    { key: 'pressure', label: t.pressure, unit: 'hPa' },
    { key: 'precip', label: t.precip, unit: 'mm' }
  ]

  const observationsByStationTime = new Map<string, JSStationObservation>()
  for (const observation of scopedObservations) {
    const key = `${observation.stationID}:${observationTimeKey(observation.time)}`
    observationsByStationTime.set(key, observation)
  }

  const rows: ObservationGridRow[] = []
  const nMetrics = metricRowDefs.length
  selectedStations.forEach((station, si) => {
    const stationBg = si % 2 === 0 ? 'oklch(0.972 0.006 255)' : 'oklch(0.962 0.008 255)'
    const labelBg = si % 2 === 0 ? '#fff' : 'oklch(0.986 0.003 255)'
    metricRowDefs.forEach((metric, mi) => {
      const cells = timeKeys.map((timeKey, ci) => {
        const latest = ci === lastIdx
        const base = observationCell(metric.key, observationsByStationTime.get(`${station.id}:${timeKey}`))
        return {
          ...base,
          bg: latest && base.bg === 'transparent' ? softColor : base.bg,
          sideBorder: latest ? `2px solid ${primaryColor}` : '1px solid oklch(0.95 0.005 255)'
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
        topBorder: mi === 0 && si > 0 ? '2px solid oklch(0.84 0.012 255)' : '1px solid oklch(0.95 0.005 255)'
      })
    })
  })

  return {
    rows,
    timeCols,
    summary: lang === 'pt'
      ? `${selectedStations.length} estações · ${nMetrics} parâmetros · de hora a hora · ${timeCols[0].label}–${timeCols[lastIdx].label}`
      : `${selectedStations.length} stations · ${nMetrics} parameters · hourly · ${timeCols[0].label}–${timeCols[lastIdx].label}`,
    stationLabel: lang === 'pt' ? 'Estação' : 'Station',
    paramLabel: lang === 'pt' ? 'Parâmetro' : 'Parameter',
    timeLabel: t.time
  }
}
