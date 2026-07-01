import { districtHref, locationHref } from '#shared/slug'
import { PT_GEO } from '~/utils/portugal-geo-data'

export default defineSitemapEventHandler(async (event) => {
  const locations = await cachedLocations(event)
  return [
    {
      loc: '/maps',
      changefreq: 'hourly',
      priority: 0.7
    },
    ...PT_GEO.districts.map(district => ({
      loc: districtHref(district.name),
      changefreq: 'hourly',
      priority: 0.6
    })),
    ...locations.map(location => ({
      loc: locationHref(location.id, location.name),
      changefreq: 'hourly',
      priority: 0.8
    }))
  ]
})
