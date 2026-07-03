import { describe, expect, it } from 'vitest'
import { buildLocationMeta, buildLocationTree, buildWarningBanner } from '~/utils/locationTransform'
import type { JSDistrict, JSLocation, JSWeatherWarning } from '#shared/ipma-types'

function loc(overrides: Partial<JSLocation> = {}): JSLocation {
  return {
    id: 1,
    name: 'Lisboa',
    regionID: 1,
    districtID: 11,
    municipalityID: 1106,
    warningAreaID: 'LSB',
    latitude: 38.72,
    longitude: -9.14,
    ...overrides,
  }
}

function district(overrides: Partial<JSDistrict> = {}): JSDistrict {
  return { regionID: 1, id: 11, name: 'Lisboa', ...overrides }
}

function warning(overrides: Partial<JSWeatherWarning> = {}): JSWeatherWarning {
  return {
    id: 'w1',
    text: 'Some warning text',
    awarenessTypeName: 'Tempo Quente',
    warningAreaID: 'LSB',
    startTime: '2026-07-01T00:00:00Z',
    endTime: '2026-07-10T00:00:00Z',
    awarenessLevelID: 'orange',
    level: null,
    ...overrides,
  }
}

const districtMap = new Map<number, JSDistrict>([[11, district({ id: 11, name: 'Lisboa' })], [13, district({ id: 13, regionID: 1, name: 'Porto' })]])
const now = new Date('2026-07-02T12:00:00Z').getTime()

describe('buildLocationTree', () => {
  it('groups mainland locations by district and non-mainland by region', () => {
    const locations = [
      loc({ id: 1, name: 'Lisboa', regionID: 1, districtID: 11 }),
      loc({ id: 2, name: 'Porto', regionID: 1, districtID: 13 }),
      loc({ id: 3, name: 'Funchal', regionID: 2, districtID: 0 }),
    ]
    const tree = buildLocationTree(locations, districtMap, new Map(), null, {}, '', 'en', now)
    const groupNames = tree.map(g => g.name).sort()
    expect(groupNames).toEqual(['Lisboa', 'Madeira', 'Porto'])
  })

  it('filters locations by a case-insensitive substring query', () => {
    const locations = [
      loc({ id: 1, name: 'Lisboa', districtID: 11 }),
      loc({ id: 2, name: 'Porto', districtID: 13 }),
    ]
    const tree = buildLocationTree(locations, districtMap, new Map(), null, {}, 'LIS', 'en', now)
    expect(tree).toHaveLength(1)
    expect(tree[0].locs.map(l => l.name)).toEqual(['Lisboa'])
  })

  it('counts only active warnings, not expired ones', () => {
    const locations = [loc({ id: 1, name: 'Lisboa', districtID: 11, warningAreaID: 'LSB' })]
    const warningsByArea = new Map<string, JSWeatherWarning[]>([
      ['LSB', [warning({ startTime: '2020-01-01T00:00:00Z', endTime: '2020-01-02T00:00:00Z' })]],
    ])
    const tree = buildLocationTree(locations, districtMap, warningsByArea, null, {}, '', 'en', now)
    expect(tree[0].warnCount).toBe(0)
    expect(tree[0].locs[0].warn).toBe(false)
  })

  it('counts a currently-active warning against the location and group', () => {
    const locations = [loc({ id: 1, name: 'Lisboa', districtID: 11, warningAreaID: 'LSB' })]
    const warningsByArea = new Map<string, JSWeatherWarning[]>([
      ['LSB', [warning({ startTime: '2020-01-01T00:00:00Z', endTime: '2099-01-01T00:00:00Z' })]],
    ])
    const tree = buildLocationTree(locations, districtMap, warningsByArea, null, {}, '', 'en', now)
    expect(tree[0].warnCount).toBe(1)
    expect(tree[0].locs[0].warn).toBe(true)
  })

  it('marks the selected location and defaults group-open state to whether it contains the selection', () => {
    const locations = [loc({ id: 1, name: 'Lisboa', districtID: 11 })]
    const tree = buildLocationTree(locations, districtMap, new Map(), 1, {}, '', 'en', now)
    expect(tree[0].locs[0].selected).toBe(true)
    expect(tree[0].open).toBe(true)
  })
})

describe('buildWarningBanner', () => {
  const t = 'Warnings'

  it('returns hasWarn false when there are no active non-green warnings', () => {
    const banner = buildWarningBanner([warning({ awarenessLevelID: 'green' })], 'en', t, now)
    expect(banner.hasWarn).toBe(false)
    expect(banner.banner).toBeNull()
  })

  it('picks the highest-ranked active warning when several apply', () => {
    const warnings = [
      warning({ id: 'a', awarenessLevelID: 'yellow' }),
      warning({ id: 'b', awarenessLevelID: 'red' }),
      warning({ id: 'c', awarenessLevelID: 'orange' }),
    ]
    const banner = buildWarningBanner(warnings, 'en', t, now)
    expect(banner.hasWarn).toBe(true)
    expect(banner.banner?.level).toBe('Red')
  })

  it('ignores expired warnings when selecting the top level', () => {
    const warnings = [
      warning({ id: 'expired-red', awarenessLevelID: 'red', startTime: '2020-01-01T00:00:00Z', endTime: '2020-01-02T00:00:00Z' }),
      warning({ id: 'active-yellow', awarenessLevelID: 'yellow', startTime: '2020-01-01T00:00:00Z', endTime: '2099-01-01T00:00:00Z' }),
    ]
    const banner = buildWarningBanner(warnings, 'en', t, now)
    expect(banner.banner?.level).toBe('Yellow')
  })
})

describe('buildLocationMeta', () => {
  it('formats coordinates with hemisphere suffixes', () => {
    const meta = buildLocationMeta(loc({ latitude: 38.72, longitude: -9.14 }), district(), null, 'en')
    expect(meta.coord).toBe('38.72°N 9.14°W')
  })

  it('falls back to a dash when there is no district or update time', () => {
    const meta = buildLocationMeta(loc(), undefined, null, 'en')
    expect(meta.district).toBe('—')
    expect(meta.updated).toBe('—')
  })
})
