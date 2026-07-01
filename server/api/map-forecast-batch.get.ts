export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const idsParam = typeof query.ids === 'string' ? query.ids : ''
  const ids = [...new Set(
    idsParam.split(',').map(s => Number(s.trim())).filter(n => Number.isFinite(n) && n > 0)
  )].slice(0, 80)

  const results = await Promise.all(
    ids.map(async (id) => {
      try {
        const fc = await cachedForecast(event, id)
        const today = (fc as unknown as { daily: { tMax: number; weatherTypeID: number; forecastDate: string }[] }).daily?.[0]
        return { id: String(id), tmax: today?.tMax ?? null, wt: today?.weatherTypeID ?? null }
      } catch {
        return { id: String(id), tmax: null, wt: null }
      }
    })
  )

  return results as { id: string; tmax: number | null; wt: number | null }[]
})
