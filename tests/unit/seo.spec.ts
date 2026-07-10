import { describe, expect, it } from 'vitest'
import {
  absoluteSiteUrl,
  locationImageDescription,
  pageDescription,
  pageTitle,
  trimTrailingSlash,
} from '~/utils/seo'

describe('trimTrailingSlash', () => {
  it('removes trailing slashes from origins', () => {
    expect(trimTrailingSlash('https://example.com///')).toBe('https://example.com')
  })
})

describe('absoluteSiteUrl', () => {
  it('builds an absolute URL from the configured site URL first', () => {
    expect(absoluteSiteUrl('/maps', 'https://weather.example', 'http://localhost:3000')).toBe('https://weather.example/maps')
  })

  it('falls back to request origin when site URL is missing', () => {
    expect(absoluteSiteUrl('location/1110600-lisboa', null, 'http://localhost:3000')).toBe('http://localhost:3000/location/1110600-lisboa')
  })

  it('returns null when neither origin is available', () => {
    expect(absoluteSiteUrl('/maps', null, null)).toBeNull()
  })
})

describe('page metadata defaults', () => {
  it('normalizes blank titles and descriptions to site defaults', () => {
    expect(pageTitle('')).toBe('MET·PT')
    expect(pageDescription('  ')).toBe('Portugal weather forecasts, observations, and warnings from IPMA.')
  })
})

describe('locationImageDescription', () => {
  it('includes an active warning level when present', () => {
    expect(locationImageDescription('Lisboa', 'Yellow')).toBe(
      'Lisboa: Yellow weather warning active. Forecast, observations, and IPMA warnings.',
    )
  })

  it('uses neutral forecast copy without a warning', () => {
    expect(locationImageDescription('Porto')).toBe(
      'Porto: forecast, observations, and IPMA warnings.',
    )
  })
})
