import { DEFAULT_LOCATION_PATH, isValidLocationSlug, LAST_LOCATION_COOKIE } from '#shared/slug'

// Nitro file routes take precedence over the Nuxt page renderer, so a hard
// load of `/` never boots Vue SSR here — zero bootstrap work, just a redirect
// based on the last-visited-location cookie written client-side (see
// app/pages/location/[slug].vue).
export default defineEventHandler((event) => {
  const raw = getCookie(event, LAST_LOCATION_COOKIE)
  const target = raw && isValidLocationSlug(raw) ? `/location/${raw}` : DEFAULT_LOCATION_PATH
  setResponseHeader(event, 'Cache-Control', 'no-store')
  return sendRedirect(event, target, 307)
})
