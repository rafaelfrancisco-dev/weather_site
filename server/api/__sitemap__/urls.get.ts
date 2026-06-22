import { locationHref } from '#shared/slug'

export default defineSitemapEventHandler(async (event) => {
  const locations = await cachedLocations(event)
  return locations.map(location => ({
    loc: locationHref(location.id, location.name),
    changefreq: 'hourly',
    priority: 0.8
  }))
})
