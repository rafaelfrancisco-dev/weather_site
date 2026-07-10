import { describe, expect, it } from 'vitest'
import { DISTRICT_ROUTE_META, districtHref } from '#shared/slug'
import { CAPITALS } from '~/utils/maps'
import { PT_GEO } from '~/utils/portugal-geo-data'

describe('district route catalog consistency', () => {
  it('matches every map-focus district and group', () => {
    const focusDistricts = new Map(CAPITALS.map(capital => [capital.district, capital.group]))
    const routeDistricts = new Map(DISTRICT_ROUTE_META.map(district => [district.name, district.group]))

    expect(routeDistricts).toEqual(focusDistricts)
  })

  it('matches every district included in the sitemap source', () => {
    const sitemapRoutes = PT_GEO.districts.map(district => districtHref(district.name)).sort()
    const catalogRoutes = DISTRICT_ROUTE_META.map(district => districtHref(district.name)).sort()

    expect(catalogRoutes).toEqual(sitemapRoutes)
  })
})
