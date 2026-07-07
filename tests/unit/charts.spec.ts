import { describe, expect, it } from 'vitest'
import { buildDailyRangeModel, buildMeteogramModel } from '~/utils/charts'
import { wallParseMs } from '~/utils/format'
import type { JSAggregateForecastDay, JSHourlyForecastPeriod } from '#shared/ipma-types'

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

describe('buildMeteogramModel', () => {
  const anyNow = wallParseMs('2026-07-02T12:00:00')

  it('returns null for empty periods', () => {
    expect(buildMeteogramModel([], 'en', anyNow)).toBeNull()
  })

  it('caps the window at 3 days and marks day bounds at each day start', () => {
    const periods = [
      period({ forecastDate: '2026-07-02T10:00:00' }),
      period({ forecastDate: '2026-07-02T13:00:00' }),
      period({ forecastDate: '2026-07-03T10:00:00' }),
      period({ forecastDate: '2026-07-04T10:00:00' }),
      period({ forecastDate: '2026-07-05T10:00:00' }),
    ]
    const model = buildMeteogramModel(periods, 'en', anyNow)!
    expect(model.labels).toEqual(['10', '13', '10', '10'])
    expect(model.dayBounds.map(b => b.index)).toEqual([0, 2, 3])
    // 2026-07-02 is a Thursday
    expect(model.dayBounds[0].label).toBe('Thu 2 Jul')
  })

  it('points nowIndex at the period closest to now', () => {
    const periods = [
      period({ forecastDate: '2026-07-02T10:00:00' }),
      period({ forecastDate: '2026-07-02T13:00:00' }),
      period({ forecastDate: '2026-07-02T16:00:00' }),
    ]
    const model = buildMeteogramModel(periods, 'en', wallParseMs('2026-07-02T13:05:00'))!
    expect(model.nowIndex).toBe(1)
  })

  it('nulls out missing feels-like and precipitation values', () => {
    const model = buildMeteogramModel(
      [period({ feelsLike: null, precipitationProbability: null })],
      'en',
      anyNow,
    )!
    expect(model.feels).toEqual([null])
    expect(model.precip).toEqual([null])
  })

  it('pads the suggested temperature range beyond temp and feels-like extremes', () => {
    const model = buildMeteogramModel(
      [period({ tMed: 20, feelsLike: 17 }), period({ tMed: 28, feelsLike: 31 })],
      'en',
      anyNow,
    )!
    expect(model.tempSuggestedMin).toBe(15)
    expect(model.tempSuggestedMax).toBe(33)
  })

  it('labels start at the first kept hour, matching the hourly grid trim window', () => {
    const nowWallMs = wallParseMs('2026-07-02T20:00:00')
    const periods = [
      period({ forecastDate: '2026-07-02T07:59:00' }), // >12h before, dropped
      period({ forecastDate: '2026-07-02T08:00:00' }), // exactly -12h, kept
      period({ forecastDate: '2026-07-02T20:00:00' }),
    ]
    const model = buildMeteogramModel(periods, 'en', nowWallMs)!
    expect(model.labels).toEqual(['08', '20'])
  })
})

describe('buildDailyRangeModel', () => {
  it('returns null for empty daily data', () => {
    expect(buildDailyRangeModel([], 'en')).toBeNull()
  })

  it('builds two-line labels in the given language', () => {
    const model = buildDailyRangeModel([day({ forecastDate: '2026-07-02' })], 'pt')!
    expect(model.labels).toEqual([['Qui', '2 jul']])
  })

  it('pads the suggested range around min/max temperatures', () => {
    const model = buildDailyRangeModel(
      [day({ tMin: 14, tMax: 24 }), day({ tMin: 12, tMax: 27 })],
      'en',
    )!
    expect(model.tMin).toEqual([14, 12])
    expect(model.tMax).toEqual([24, 27])
    expect(model.suggestedMin).toBe(10)
    expect(model.suggestedMax).toBe(29)
  })
})
