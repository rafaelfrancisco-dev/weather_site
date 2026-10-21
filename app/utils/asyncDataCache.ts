// Shared `getCachedData` policy for useAsyncData entries whose data must be
// reused across component remounts but must still refetch on an explicit
// refresh().
//
// Nuxt's `experimental.granularCachedData` defaults to true in Nuxt 4, which
// makes Nuxt consult getCachedData on manual refreshes too, not only for
// 'initial' causes. Without the cause guard below,
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
