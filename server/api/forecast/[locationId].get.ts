export default defineEventHandler(async (event) => {
  const locationId = Number(getRouterParam(event, 'locationId'))
  if (!Number.isInteger(locationId) || locationId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid location id' })
  }
  // Only ids from the known location list may reach cachedForecast — every
  // unknown id would otherwise mint its own Redis entry and ISR page.
  const locations = await cachedLocations(event)
  if (!locations.some(l => l.id === locationId)) {
    throw createError({ statusCode: 404, statusMessage: 'Unknown location' })
  }
  return cachedForecast(event, locationId)
})
