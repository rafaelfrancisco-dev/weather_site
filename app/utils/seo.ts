export const SITE_TITLE = 'MET·PT'
export const SITE_DESCRIPTION = 'Portugal weather forecasts, observations, and warnings from IPMA.'
export const OG_IMAGE_WIDTH = 1200
export const OG_IMAGE_HEIGHT = 630

export function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

export function absoluteSiteUrl(path: string, siteUrl?: string | null, requestOrigin?: string | null): string | null {
  const origin = siteUrl || requestOrigin
  if (!origin) return null
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${trimTrailingSlash(origin)}${normalizedPath}`
}

export function pageTitle(title?: string | null): string {
  return title?.trim() || SITE_TITLE
}

export function pageDescription(description?: string | null): string {
  return description?.trim() || SITE_DESCRIPTION
}

export function locationImageDescription(name: string, warningLevel?: string | null): string {
  return warningLevel
    ? `${name}: ${warningLevel} weather warning active. Forecast, observations, and IPMA warnings.`
    : `${name}: forecast, observations, and IPMA warnings.`
}
