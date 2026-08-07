// Shared `getCachedData` policy for useAsyncData entries whose data must be
// reused across component remounts but must still refetch on an explicit
// refresh().
//
// Supplying *any* custom getCachedData sets Nitro's `granularCachedData`, which
// makes Nuxt consult it on manual refreshes too — unlike the default, which
// only ever answers for 'initial' causes. Without the cause guard below,
// refreshObservations()/refreshBootstrap() would be handed the cached value and
// the visibilitychange revalidation in useLocationsData.ts would silently
// become a no-op.
const REFRESH_CAUSES = new Set(['refresh:manual', 'refresh:hook'])

export interface AsyncDataCacheSource {
  payload: { data: Record<string, unknown> }
  static: { data: Record<string, unknown> }
}

export function cachedUnlessRefreshing<T>(
  key: string,
  source: AsyncDataCacheSource,
  ctx: { cause?: string }
): T | undefined {
  if (ctx.cause != null && REFRESH_CAUSES.has(ctx.cause)) return undefined
  return (source.payload.data[key] ?? source.static.data[key]) as T | undefined
}
