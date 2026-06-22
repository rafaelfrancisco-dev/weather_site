export default defineEventHandler((event) => {
  const locationId = Number(getRouterParam(event, 'locationId'))
  if (!Number.isFinite(locationId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid location id' })
  }
  return cachedForecast(event, locationId)
})
