import type { Lang } from '~/utils/i18n'
import { weekday, monthShort } from '~/utils/i18n'
import { tempColor, tempBg, precipColor, precipBg, windBg, uvColor, levelColor, levelSoft, levelLabelTxt, levelRank } from '~/utils/colors'
import type { WarningLevel } from '~/utils/colors'
import { windArrowDeg, hourLabel, dateKey, isDaytime } from '~/utils/format'
import type {
  JSLocation,
  JSDistrict,
  JSWeatherWarning,
  JSAggregateForecastDay,
  JSHourlyForecastPeriod,
  JSStationObservationFeature,
  JSLookupDescription
} from '~/utils/ipma-types'

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

    return {
      id: key,
      name: group.name,
      open: openMap[key] !== false,
      caret: openMap[key] !== false ? 90 : 0,
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
  const updated = dataUpdate
    ? new Date(dataUpdate).toLocaleString(lang === 'pt' ? 'pt-PT' : 'en-GB', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })
    : '—'
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
  const fmt = (iso: string) => new Date(iso).toLocaleString(lang === 'pt' ? 'pt-PT' : 'en-GB', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })

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

export function nearestObservations(features: JSStationObservationFeature[], lat: number, lon: number, count: number): JSStationObservationFeature[] {
  return features
    .slice()
    .sort((a, b) => {
      const da = haversineKm(lat, lon, a.geometry.coordinates[1], a.geometry.coordinates[0])
      const db = haversineKm(lat, lon, b.geometry.coordinates[1], b.geometry.coordinates[0])
      return da - db
    })
    .slice(0, count)
}

export interface ObsRow {
  station: string
  time: string
  temp: string
  tempColor: string
  humidity: string
  pressure: string
  windKmh: string
  deg: number
  precip: string
  solar: string
  rowBg: string
}

function fmtNum(v: number | null | undefined, suffix = ''): string {
  return v === null || v === undefined ? '—' : `${v}${suffix}`
}

export function buildObservationRows(features: JSStationObservationFeature[]): ObsRow[] {
  return features.map((f, i) => {
    const p = f.properties
    return {
      station: p.stationName,
      time: new Date(p.time).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
      temp: fmtNum(p.temperature),
      tempColor: p.temperature != null ? tempColor(p.temperature) : 'oklch(0.4 0.012 255)',
      humidity: fmtNum(p.humidity),
      pressure: fmtNum(p.pressure),
      windKmh: fmtNum(p.windSpeedKMH),
      deg: p.windDirectionID != null ? p.windDirectionID * 22.5 + 180 : 180,
      precip: fmtNum(p.precipitation),
      solar: fmtNum(p.solarRadiation),
      rowBg: i % 2 === 0 ? '#fff' : 'oklch(0.984 0.003 255)'
    }
  })
}

export function buildObservationCards(features: JSStationObservationFeature[], t: { temp: string, humidity: string, wind: string, pressure: string, precip: string, solar: string }): { station: string, time: string, metrics: { k: string, v: string, c: string }[] }[] {
  return features.map((f) => {
    const p = f.properties
    return {
      station: p.stationName,
      time: new Date(p.time).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
      metrics: [
        { k: `${t.temp} °C`, v: p.temperature != null ? `${p.temperature}°` : '—', c: p.temperature != null ? tempColor(p.temperature) : 'oklch(0.4 0.012 255)' },
        { k: `${t.humidity} %`, v: fmtNum(p.humidity, '%'), c: 'oklch(0.4 0.012 255)' },
        { k: t.pressure, v: fmtNum(p.pressure, ' hPa'), c: 'oklch(0.4 0.012 255)' },
        { k: t.wind, v: `${p.windDirectionDescription ?? '—'} ${fmtNum(p.windSpeedKMH, ' km/h')}`, c: 'oklch(0.4 0.012 255)' },
        { k: t.precip, v: fmtNum(p.precipitation, ' mm'), c: 'oklch(0.4 0.012 255)' },
        { k: t.solar, v: fmtNum(p.solarRadiation, ' W/m²'), c: 'oklch(0.4 0.012 255)' }
      ]
    }
  })
}
