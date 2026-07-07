import type {
  JSAggregateForecastDay,
  JSHourlyForecastPeriod,
} from '#shared/ipma-types'
import { precipBg, precipColor, tempBg, tempColor, uvColor, windBg } from '~/utils/colors'
import { dateKey, hourLabel, isDaytime, wallParseMs, windArrowDeg } from '~/utils/format'
import type { Lang } from '~/utils/i18n'
import { monthShort, weekday } from '~/utils/i18n'

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
  iconUrl: (weatherTypeID: number, day: boolean) => string | null,
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
      rowBg: i % 2 === 0 ? '#fff' : 'oklch(0.984 0.003 255)',
    }
  })
}

export function groupPeriodsByDay(periods: JSHourlyForecastPeriod[], maxDays: number): JSHourlyForecastPeriod[][] {
  const map = new Map<string, JSHourlyForecastPeriod[]>()
  for (const p of periods) {
    const key = dateKey(p.forecastDate)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(p)
  }
  return [...map.values()].slice(0, maxDays)
}

export const MAX_PAST_HOURLY_MS = 12 * 60 * 60 * 1000

// Falls back to the untrimmed list if everything is past, so a fully-stale
// payload still renders instead of an indefinite skeleton (ForecastTab shows
// the skeleton whenever hourRows is empty).
export function trimPastPeriods(periods: JSHourlyForecastPeriod[], nowWallMs: number): JSHourlyForecastPeriod[] {
  const cutoff = nowWallMs - MAX_PAST_HOURLY_MS
  const trimmed = periods.filter(p => wallParseMs(p.forecastDate) >= cutoff)
  return trimmed.length > 0 ? trimmed : periods
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
  isCurrent: boolean
}

export interface HourlyGrid {
  dayHeaders: { span: number, label: string }[]
  timeCols: { label: string, sep: string, isCurrent: boolean }[]
  hourRows: { label: string, unit: string, cells: HourCell[] }[]
  hourDays: { label: string, cells: { time: string, icon: string | null, title: string, temp: number, tempColor: string, pp: number, ppColor: string, deg: number, ws: number | null, isCurrent: boolean }[] }[]
}

export function buildHourlyGrid(
  periods: JSHourlyForecastPeriod[],
  lang: Lang,
  t: { weather: string, temp: string, feels: string, precipProb: string, wind: string, windSpd: string, humidity: string },
  labelFor: (id: number, lang: Lang) => string,
  iconUrl: (weatherTypeID: number, day: boolean) => string | null,
  primaryColor: string,
  showBars: boolean,
  nowWallMs: number,
): HourlyGrid {
  const days = groupPeriodsByDay(trimPastPeriods(periods, nowWallMs), 3)
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

  let activeColIndex = flat.length > 0 ? 0 : -1
  let minDiff = Infinity
  for (let i = 0; i < flat.length; i++) {
    const diff = Math.abs(wallParseMs(flat[i].forecastDate) - nowWallMs)
    if (diff < minDiff) {
      minDiff = diff
      activeColIndex = i
    }
  }

  const timeCols = flat.map((p, i) => ({
    label: hourLabel(p.forecastDate),
    sep: dayBoundaries.has(i) ? '2px solid oklch(0.85 0.01 255)' : '1px solid oklch(0.95 0.005 255)',
    isCurrent: i === activeColIndex,
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
      title: '',
      isCurrent: i === activeColIndex,
    }
    return Object.assign(base, fn(p, i))
  })

  const hourRows = [
    { label: t.weather, unit: '', cells: mkCells(p => ({ isIcon: true, icon: iconUrl(p.weatherTypeID, isDaytime(p.forecastDate)), title: labelFor(p.weatherTypeID, lang) })) },
    { label: t.temp, unit: '°C', cells: mkCells(p => ({ isText: true, main: `${p.tMed}°`, bg: tempBg(p.tMed), weight: 600, color: tempColor(p.tMed) })) },
    { label: t.feels, unit: '°C', cells: mkCells(p => ({ isText: true, main: p.feelsLike != null ? `${p.feelsLike}°` : '—', color: 'oklch(0.46 0.012 255)' })) },
    {
      label: t.precipProb,
      unit: '',
      cells: mkCells((p) => {
        const pp = p.precipitationProbability ?? 0
        return { isText: true, main: pp > 0 ? `${pp}%` : '–', bg: precipBg(pp), color: precipColor(pp), showBar: showBars && pp > 0, barH: `${pp}%`, barColor: 'oklch(0.55 0.13 250)' }
      }),
    },
    { label: t.wind, unit: '', cells: mkCells(p => ({ isWind: true, deg: windArrowDeg(p.windDirection), main: p.windDirection })) },
    { label: t.windSpd, unit: 'km/h', cells: mkCells(p => ({ isText: true, main: p.windSpeed != null ? String(p.windSpeed) : '—', bg: windBg(p.windSpeed ?? 0), color: 'oklch(0.4 0.012 255)' })) },
    { label: t.humidity, unit: '%', cells: mkCells(p => ({ isText: true, main: p.humidity != null ? `${p.humidity}%` : '—', color: 'oklch(0.46 0.012 255)' })) },
  ]

  let flatIdx = 0
  const hourDays = days.map((group) => {
    const d = new Date(group[0].forecastDate)
    const startIdx = flatIdx
    flatIdx += group.length
    return {
      label: `${weekday(d, lang)} ${d.getDate()} ${monthShort(d, lang)}`,
      cells: group.map((p, ci) => ({
        time: `${hourLabel(p.forecastDate)}h`,
        icon: iconUrl(p.weatherTypeID, isDaytime(p.forecastDate)),
        title: labelFor(p.weatherTypeID, lang),
        temp: p.tMed,
        tempColor: tempColor(p.tMed),
        pp: p.precipitationProbability ?? 0,
        ppColor: precipColor(p.precipitationProbability ?? 0),
        deg: windArrowDeg(p.windDirection),
        ws: p.windSpeed,
        isCurrent: startIdx + ci === activeColIndex,
      })),
    }
  })

  return { dayHeaders, timeCols, hourRows, hourDays }
}
