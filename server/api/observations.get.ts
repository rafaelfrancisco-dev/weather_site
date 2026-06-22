export default defineEventHandler(async (event) => {
  const [stations, observations] = await Promise.all([
    cachedStations(event),
    cachedObservations(event)
  ])
  return { stations, observations }
})
