import { describe, expect, it } from 'vitest'
import { isDaytimeAtWallMs, wallClockMs, wallParseMs } from '~/utils/format'

describe('wallParseMs', () => {
  it('parses a zoneless datetime string as a UTC instant, not env-local', () => {
    expect(wallParseMs('2026-07-02T13:00:00')).toBe(Date.UTC(2026, 6, 2, 13, 0, 0))
  })

  it('parses a date-only string without appending Z', () => {
    expect(wallParseMs('2026-07-02')).toBe(Date.parse('2026-07-02'))
  })
})

describe('wallClockMs', () => {
  it('honors the explicit IANA zone rather than the host process TZ', () => {
    // This suite runs with TZ=Europe/Lisbon (vitest.config / package.json test
    // script). If wallClockMs ignored its timeZone argument and fell back to
    // the host TZ, both calls below would return the same value.
    const instant = Date.UTC(2026, 6, 3, 18, 43, 0) // 2026-07-03T18:43:00Z
    const lisbonWall = wallClockMs(instant, 'Europe/Lisbon')
    const utcWall = wallClockMs(instant, 'UTC')
    expect(utcWall).toBe(instant)
    expect(lisbonWall).toBe(Date.UTC(2026, 6, 3, 19, 43, 0)) // Lisbon is UTC+1 (WEST) in July
    expect(lisbonWall).not.toBe(utcWall)
  })

  it('round-trips with wallParseMs for the same wall-clock digits', () => {
    const instant = Date.UTC(2026, 6, 3, 18, 43, 0)
    expect(wallClockMs(instant, 'UTC')).toBe(wallParseMs('2026-07-03T18:43:00'))
  })
})

describe('isDaytimeAtWallMs', () => {
  it('is true between 07:00 and 20:00 wall-clock', () => {
    expect(isDaytimeAtWallMs(Date.UTC(2026, 6, 3, 7, 0, 0))).toBe(true)
    expect(isDaytimeAtWallMs(Date.UTC(2026, 6, 3, 19, 59, 0))).toBe(true)
  })

  it('is false outside 07:00-20:00 wall-clock', () => {
    expect(isDaytimeAtWallMs(Date.UTC(2026, 6, 3, 6, 59, 0))).toBe(false)
    expect(isDaytimeAtWallMs(Date.UTC(2026, 6, 3, 20, 0, 0))).toBe(false)
  })
})
