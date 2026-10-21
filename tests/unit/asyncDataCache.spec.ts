import { describe, expect, it } from 'vitest'
import { cachedUnlessRefreshing, type AsyncDataCacheSource } from '~/utils/asyncDataCache'

function source(payload: Record<string, unknown> = {}, staticData: Record<string, unknown> = {}): AsyncDataCacheSource {
  return { payload: { data: payload }, static: { data: staticData } }
}

describe('cachedUnlessRefreshing', () => {
  it('serves payload data on a fresh mount, so a remount does not refetch', () => {
    const src = source({ 'ipma-observations': { stations: [], observations: [] } })
    expect(cachedUnlessRefreshing('ipma-observations', src, { cause: 'initial' })).toEqual({ stations: [], observations: [] })
  })

  it('falls back to prerendered static payload data', () => {
    const src = source({}, { 'ipma-observations': { stations: [1], observations: [] } })
    expect(cachedUnlessRefreshing('ipma-observations', src, { cause: 'initial' })).toEqual({ stations: [1], observations: [] })
  })

  it('returns undefined when nothing is cached, so the first mount fetches', () => {
    expect(cachedUnlessRefreshing('ipma-observations', source(), { cause: 'initial' })).toBeUndefined()
  })

  // The regression this guards: with Nuxt 4's default `granularCachedData`,
  // getCachedData is consulted on refresh causes too. Returning
  // cached data there would make refreshObservations()/refreshBootstrap() —
  // and therefore the visibilitychange revalidation in useLocationsData.ts —
  // silently do nothing.
  it.each(['refresh:manual', 'refresh:hook'])('always refetches for cause %s', (cause) => {
    const src = source({ 'ipma-observations': { stations: [], observations: [] } })
    expect(cachedUnlessRefreshing('ipma-observations', src, { cause })).toBeUndefined()
  })

  it('does not treat the watch cause as a refresh', () => {
    const src = source({ 'ipma-observations': { stations: [], observations: [] } })
    expect(cachedUnlessRefreshing('ipma-observations', src, { cause: 'watch' })).toEqual({ stations: [], observations: [] })
  })
})
