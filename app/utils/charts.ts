// Pure chart-model builders, same pattern as the transform modules: raw IPMA
// types in, render-ready data out, no component logic. Purely data-shaped —
// no accent color is baked in here; accent styling happens in the chart
// components via a `primary` prop.
import type {
  JSAggregateForecastDay,
  JSHourlyForecastPeriod,
} from '#shared/ipma-types'
import { groupPeriodsByDay } from '~/utils/forecastTransform'
import { hourLabel, wallParseMs } from '~/utils/format'
import type { Lang } from '~/utils/i18n'
import { monthShort, weekday } from '~/utils/i18n'

export interface MeteogramModel {
  labels: string[]
  temp: number[]
  feels: (number | null)[]
  precip: (number | null)[]
  nowIndex: number
  dayBounds: { index: number, label: string }[]
  tempSuggestedMin: number
  tempSuggestedMax: number
}

export function buildMeteogramModel(
  periods: JSHourlyForecastPeriod[],
  lang: Lang,
  nowWallMs: number,
): MeteogramModel | null {
  // Same 3-day window as the hourly grid, so the chart and the table below it
  // always describe the same periods.
  const days = groupPeriodsByDay(periods, 3)
  const flat = days.flat()
  if (flat.length === 0) return null

  const dayBounds: { index: number, label: string }[] = []
  let acc = 0
  for (const group of days) {
    const d = new Date(group[0].forecastDate)
    dayBounds.push({ index: acc, label: `${weekday(d, lang)} ${d.getDate()} ${monthShort(d, lang)}` })
    acc += group.length
  }

  let nowIndex = 0
  let minDiff = Infinity
  for (let i = 0; i < flat.length; i++) {
    const diff = Math.abs(wallParseMs(flat[i].forecastDate) - nowWallMs)
    if (diff < minDiff) {
      minDiff = diff
      nowIndex = i
    }
  }

  const temp = flat.map(p => p.tMed)
  const feels = flat.map(p => p.feelsLike ?? null)
  const tempValues = [...temp, ...feels.filter((v): v is number => v != null)]

  return {
    labels: flat.map(p => hourLabel(p.forecastDate)),
    temp,
    feels,
    precip: flat.map(p => p.precipitationProbability ?? null),
    nowIndex,
    dayBounds,
    tempSuggestedMin: Math.floor(Math.min(...tempValues)) - 2,
    tempSuggestedMax: Math.ceil(Math.max(...tempValues)) + 2,
  }
}

export interface DailyRangeModel {
  // Two-line category labels: [weekday, 'D mon'].
  labels: string[][]
  tMax: number[]
  tMin: number[]
  suggestedMin: number
  suggestedMax: number
}

export function buildDailyRangeModel(
  daily: JSAggregateForecastDay[],
  lang: Lang,
): DailyRangeModel | null {
  if (daily.length === 0) return null

  const labels = daily.map((d) => {
    const date = new Date(d.forecastDate)
    return [weekday(date, lang), `${date.getDate()} ${monthShort(date, lang)}`]
  })
  const tMax = daily.map(d => d.tMax)
  const tMin = daily.map(d => d.tMin)

  return {
    labels,
    tMax,
    tMin,
    suggestedMin: Math.floor(Math.min(...tMin)) - 2,
    suggestedMax: Math.ceil(Math.max(...tMax)) + 2,
  }
}
