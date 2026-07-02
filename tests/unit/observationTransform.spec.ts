import { describe, expect, it } from 'vitest'
import { buildObservationGrid } from '~/utils/observationTransform'
import type { JSStation, JSStationObservation } from '#shared/ipma-types'

const t = { time: 'Time', temp: 'Temp', humidity: 'Humidity', wind: 'Wind', pressure: 'Pressure', precip: 'Precip' }
const primaryColor = 'oklch(0.5 0.12 255)'
const softColor = 'oklch(0.955 0.03 255)'

function station(overrides: Partial<JSStation> = {}): JSStation {
  return { id: 1, name: 'Station 1', latitude: 38.72, longitude: -9.14, ...overrides }
}

function observation(overrides: Partial<JSStationObservation> = {}): JSStationObservation {
  return {
    time: '2026-07-02T12:00:00Z',
    stationID: 1,
    temperature: 22,
    humidity: 60,
    pressure: 1015,
    windSpeedKMH: 10,
    windSpeedMS: 2.8,
    windDirectionID: 4,
    precipitation: 0,
    solarRadiation: null,
    ...overrides,
  }
}

// Center point near station 1; stations 2/3/4/5/6 progressively further east.
const CENTER = { lat: 38.72, lon: -9.14 }

describe('buildObservationGrid', () => {
  it('returns an empty grid when no stations have observations', () => {
    const grid = buildObservationGrid([station()], [], CENTER.lat, CENTER.lon, 'en', t, primaryColor, softColor)
    expect(grid.rows).toEqual([])
    expect(grid.stationCards).toEqual([])
    expect(grid.summary).toBe('No observations available')
  })

  it('caps station selection at 5, preferring the nearest', () => {
    const stations: JSStation[] = Array.from({ length: 8 }, (_, i) =>
      station({ id: i + 1, name: `Station ${i + 1}`, latitude: CENTER.lat, longitude: CENTER.lon + i * 0.5 }))
    const observations: JSStationObservation[] = stations.map(s => observation({ stationID: s.id }))

    const grid = buildObservationGrid(stations, observations, CENTER.lat, CENTER.lon, 'en', t, primaryColor, softColor)

    expect(grid.stationCards).toHaveLength(5)
    expect(grid.stationCards.map(c => c.name)).toEqual(['Station 1', 'Station 2', 'Station 3', 'Station 4', 'Station 5'])
  })

  it('only includes stations that actually have observations', () => {
    const stations = [station({ id: 1 }), station({ id: 2, name: 'No Data Station' })]
    const observations = [observation({ stationID: 1 })]
    const grid = buildObservationGrid(stations, observations, CENTER.lat, CENTER.lon, 'en', t, primaryColor, softColor)
    expect(grid.stationCards.map(c => c.name)).toEqual(['Station 1'])
  })

  it('keeps at most the 7 most recent distinct time columns', () => {
    const times = Array.from({ length: 10 }, (_, i) => `2026-07-02T${String(i + 5).padStart(2, '0')}:00:00Z`)
    const observations = times.map(time => observation({ time }))
    const grid = buildObservationGrid([station()], observations, CENTER.lat, CENTER.lon, 'en', t, primaryColor, softColor)
    expect(grid.timeCols).toHaveLength(7)
    // Most recent (oldest-to-newest, ascending) column should be the last of the 10 hours;
    // 14:00 UTC is 15:00 in Europe/Lisbon during July (DST).
    expect(grid.timeCols[grid.timeCols.length - 1].label).toBe('15:00')
  })

  it('renders a dash placeholder cell for a missing metric value', () => {
    const observations = [observation({ temperature: null })]
    const grid = buildObservationGrid([station()], observations, CENTER.lat, CENTER.lon, 'en', t, primaryColor, softColor)
    const tempRow = grid.rows.find(r => r.label === t.temp)!
    expect(tempRow.cells[0].main).toBe('–')
    expect(tempRow.cells[0].isText).toBe(true)
  })
})
