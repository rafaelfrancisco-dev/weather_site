import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildDailyRows, buildHourlyGrid } from '~/utils/forecastTransform'
import type { JSAggregateForecastDay, JSHourlyForecastPeriod } from '#shared/ipma-types'

const labelFor = (id: number) => `Type ${id}`
const iconUrl = (id: number, day: boolean) => `icon-${id}-${day ? 'd' : 'n'}.svg`

function day(overrides: Partial<JSAggregateForecastDay> = {}): JSAggregateForecastDay {
  return {
    forecastDate: '2026-07-02',
    tMin: 14,
    tMax: 24,
    precipitationProbability: 10,
    weatherTypeID: 1,
    windDirection: 'N',
    windGust: 30,
    uvIndex: 6,
    uvInterval: null,
    feelsLike: null,
    humidity: null,
    seaWaterTemp: null,
    swell: null,
    totalSea: null,
    swellDirection: null,
    swellPeriod: null,
    peakPeriod: null,
    precipitationIntensityClassID: null,
    ...overrides,
  }
}

function period(overrides: Partial<JSHourlyForecastPeriod> = {}): JSHourlyForecastPeriod {
  return {
    forecastDate: '2026-07-02T12:00:00',
    periodType: 1,
    tMed: 20,
    humidity: 55,
    feelsLike: 19,
    windSpeed: 12,
    weatherTypeID: 1,
    windDirection: 'N',
    precipitationProbability: 0,
    precipitationIntensityClassID: null,
    ...overrides,
  }
}

describe('buildDailyRows', () => {
  it('falls back to placeholders when optional fields are missing', () => {
    const rows = buildDailyRows(
      [day({ windGust: null, uvIndex: null, precipitationProbability: null })],
      'en',
      labelFor,
      iconUrl,
    )
    expect(rows[0].windSpeed).toBe('—')
    expect(rows[0].uv).toBe('—')
    expect(rows[0].precipProb).toBe(0)
  })

  it('alternates row background by index', () => {
    const rows = buildDailyRows([day(), day(), day()], 'en', labelFor, iconUrl)
    expect(rows[0].rowBg).toBe('#fff')
    expect(rows[1].rowBg).toBe('oklch(0.984 0.003 255)')
    expect(rows[2].rowBg).toBe('#fff')
  })

  it('formats day-of-week and date using the given language', () => {
    const rows = buildDailyRows([day({ forecastDate: '2026-07-02' })], 'pt', labelFor, iconUrl)
    // 2026-07-02 is a Thursday
    expect(rows[0].dow).toBe('Qui')
    expect(rows[0].date).toBe('2 jul')
  })
})

describe('buildHourlyGrid', () => {
  const t = { weather: 'Weather', temp: 'Temp', feels: 'Feels', precipProb: 'Precip %', wind: 'Wind', windSpd: 'Wind', humidity: 'Humidity' }

  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('groups periods into day headers with correct spans', () => {
    const periods = [
      period({ forecastDate: '2026-07-02T10:00:00' }),
      period({ forecastDate: '2026-07-02T13:00:00' }),
      period({ forecastDate: '2026-07-03T10:00:00' }),
    ]
    const grid = buildHourlyGrid(periods, 'en', t, labelFor, iconUrl, 'oklch(0.5 0.1 255)', false)
    expect(grid.dayHeaders).toHaveLength(2)
    expect(grid.dayHeaders[0].span).toBe(2)
    expect(grid.dayHeaders[1].span).toBe(1)
  })

  it('marks a day-boundary separator on the first column of each new day', () => {
    const periods = [
      period({ forecastDate: '2026-07-02T10:00:00' }),
      period({ forecastDate: '2026-07-03T10:00:00' }),
    ]
    const grid = buildHourlyGrid(periods, 'en', t, labelFor, iconUrl, 'oklch(0.5 0.1 255)', false)
    expect(grid.timeCols[0].sep).toBe('2px solid oklch(0.85 0.01 255)')
    expect(grid.timeCols[1].sep).toBe('2px solid oklch(0.85 0.01 255)')
  })

  it('flags the column closest to now as isCurrent', () => {
    vi.setSystemTime(new Date('2026-07-02T13:05:00'))
    const periods = [
      period({ forecastDate: '2026-07-02T10:00:00' }),
      period({ forecastDate: '2026-07-02T13:00:00' }),
      period({ forecastDate: '2026-07-02T16:00:00' }),
    ]
    const grid = buildHourlyGrid(periods, 'en', t, labelFor, iconUrl, 'oklch(0.5 0.1 255)', false)
    expect(grid.timeCols.map(c => c.isCurrent)).toEqual([false, true, false])
    expect(grid.hourDays[0].cells.map(c => c.isCurrent)).toEqual([false, true, false])
  })

  it('only shows precipitation bars when showBars is true and probability is positive', () => {
    const periods = [period({ precipitationProbability: 40 })]
    const withBars = buildHourlyGrid(periods, 'en', t, labelFor, iconUrl, 'oklch(0.5 0.1 255)', true)
    const withoutBars = buildHourlyGrid(periods, 'en', t, labelFor, iconUrl, 'oklch(0.5 0.1 255)', false)
    const precipRowWith = withBars.hourRows.find(r => r.label === t.precipProb)!
    const precipRowWithout = withoutBars.hourRows.find(r => r.label === t.precipProb)!
    expect(precipRowWith.cells[0].showBar).toBe(true)
    expect(precipRowWithout.cells[0].showBar).toBe(false)
  })
})
