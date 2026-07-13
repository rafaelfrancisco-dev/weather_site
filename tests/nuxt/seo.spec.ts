import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { $fetch, fetch, setup } from '@nuxt/test-utils/e2e'

const fixture = fileURLToPath(new URL('../fixtures/seo-app', import.meta.url))

await setup({
  rootDir: fixture,
  build: true,
  dev: false,
  browser: false,
  port: 3791,
  env: {
    NUXT_OG_IMAGE_SECRET: 'integration-test-signing-secret',
  },
})

function tag(html: string, key: string): string | null {
  const tags = html.match(/<(?:meta|link)\b[^>]*>/gi) ?? []
  const match = tags.find(candidate => new RegExp(`(?:property|name|rel)=["']${key}["']`, 'i').test(candidate))
  if (!match) return null
  const value = match.match(/(?:content|href)=["']([^"']*)["']/i)?.[1] ?? null
  return value?.replaceAll('&amp;', '&') ?? null
}

function tagCount(html: string, key: string): number {
  return (html.match(/<(?:meta|link)\b[^>]*>/gi) ?? [])
    .filter(candidate => new RegExp(`(?:property|name|rel)=["']${key}["']`, 'i').test(candidate))
    .length
}

function tagAttribute(html: string, key: string, attribute: string): string | null {
  const tags = html.match(/<(?:meta|link)\b[^>]*>/gi) ?? []
  const match = tags.find(candidate => new RegExp(`(?:property|name|rel)=["']${key}["']`, 'i').test(candidate))
  return match?.match(new RegExp(`${attribute}=["']([^"']*)["']`, 'i'))?.[1] ?? null
}

function pngDimensions(data: ArrayBuffer): { width: number, height: number } {
  const view = new DataView(data)
  return { width: view.getUint32(16), height: view.getUint32(20) }
}

async function html(path: string): Promise<string> {
  return await $fetch(path, { responseType: 'text' })
}

describe('route-aware SEO', () => {
  it.each([
    ['/maps', 'Weather maps', 'https://weather.test/maps'],
    ['/maps/braganca', 'Bragança weather maps', 'https://weather.test/maps/braganca'],
    ['/maps/acores', 'Açores weather maps', 'https://weather.test/maps/acores'],
    ['/maps/azores', 'Açores weather maps', 'https://weather.test/maps/acores'],
  ])('renders metadata for %s', async (path, title, canonical) => {
    const page = await html(path)
    const description = path === '/maps'
      ? 'National weather maps for Portugal with IPMA forecasts, observations, warnings, fire risk, UV, and sea conditions.'
      : `${title.replace(' weather maps', '')} weather maps with IPMA forecasts, observations, warnings, fire risk, UV, and sea conditions.`

    expect(tag(page, 'canonical')).toBe(canonical)
    expect(tag(page, 'description')).toBe(description)
    expect(tag(page, 'og:title')).toBe(title)
    expect(tag(page, 'og:description')).toBe(description)
    expect(tag(page, 'twitter:title')).toBe(title)
    expect(tag(page, 'twitter:description')).toBe(description)
    expect(tag(page, 'og:image')).toContain('/_og/d/')
    expect(tag(page, 'twitter:card')).toBe('summary_large_image')
  })

  it('returns 404 for an unknown district', async () => {
    const response = await fetch('/maps/not-a-district', { redirect: 'manual' })
    expect(response.status).toBe(404)
  })

  it('renders location metadata and warning-aware image copy', async () => {
    const page = await html('/location/1110600-lisboa')

    expect(tag(page, 'canonical')).toBe('https://weather.test/location/1110600-lisboa')
    expect(tag(page, 'alternate')).toBe('https://weather.test/location/1110600-lisboa')
    expect(tagCount(page, 'canonical')).toBe(1)
    expect(page).toContain('hreflang="x-default"')
    expect(tag(page, 'og:title')).toBe('Lisboa')
    expect(tag(page, 'og:description')).toBe('Lisboa weather forecast, observations, and warnings from IPMA.')
    expect(tag(page, 'twitter:title')).toBe('Lisboa')
    expect(tag(page, 'og:image')).toContain('/_og/d/')
  })

  it('renders the no-warning location image description', async () => {
    const page = await html('/location/2220200-porto')
    expect(tag(page, 'og:title')).toBe('Porto')
    expect(tag(page, 'og:image')).toContain('/_og/d/')
  })

  it('redirects cosmetic location slugs to the canonical path', async () => {
    const response = await fetch('/location/1110600-wrong-name', { redirect: 'manual' })
    expect(response.status).toBe(301)
    expect(response.headers.get('location')).toBe('/location/1110600-lisboa')
  })
})

describe('PWA', () => {
  it.each([
    '/maps',
    '/maps/braganca',
    '/maps/acores',
    '/maps/azores',
    '/location/1110600-lisboa',
    '/location/2220200-porto',
  ])('renders one manifest link and Apple metadata on %s', async (path) => {
    const page = await html(path)

    expect(tagCount(page, 'manifest')).toBe(1)
    expect(tag(page, 'manifest')).toBe('/manifest.webmanifest')
    expect(tag(page, 'apple-mobile-web-app-capable')).toBe('yes')
    expect(tag(page, 'apple-mobile-web-app-title')).toBe('MET·PT')
    expect(tag(page, 'apple-mobile-web-app-status-bar-style')).toBe('default')
    expect(tag(page, 'apple-touch-icon')).toBe('/apple-touch-icon.png')
    expect(tagAttribute(page, 'apple-touch-icon', 'sizes')).toBe('180x180')
    expect(tagAttribute(page, 'apple-touch-icon', 'type')).toBe('image/png')
  })

  it('serves the conservative install manifest', async () => {
    const response = await fetch('/manifest.webmanifest')
    const manifest = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('application/manifest+json')
    expect(response.headers.get('cache-control')).toBe('public, max-age=0, must-revalidate')
    expect(manifest).toEqual({
      name: 'MET·PT',
      short_name: 'MET·PT',
      description: 'Portugal weather forecasts, observations, and warnings from IPMA.',
      start_url: '/',
      display: 'standalone',
      background_color: '#f7f8f8',
      theme_color: '#2f6fb0',
      lang: 'en',
      scope: '/',
      id: '/',
      categories: ['weather'],
      icons: [
        { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: '/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    })
  })

  it.each([
    ['/pwa-192x192.png', 192],
    ['/pwa-512x512.png', 512],
    ['/pwa-maskable-512x512.png', 512],
    ['/apple-touch-icon.png', 180],
  ])('serves %s as a %dpx PNG', async (path, size) => {
    const response = await fetch(path)
    const data = await response.arrayBuffer()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('image/png')
    expect(pngDimensions(data)).toEqual({ width: size, height: size })
  })

  it('serves a standalone bilingual offline document and the favicon', async () => {
    const [offlineResponse, faviconResponse] = await Promise.all([
      fetch('/offline.html'),
      fetch('/favicon.ico'),
    ])
    const offline = await offlineResponse.text()

    expect(offlineResponse.status).toBe(200)
    expect(offlineResponse.headers.get('cache-control')).toBe('public, max-age=0, must-revalidate')
    expect(offline).toContain('You’re offline')
    expect(offline).toContain('Está sem ligação')
    expect(offline).toContain('href="/"')
    expect(offline).not.toMatch(/<script\b/i)
    expect(faviconResponse.status).toBe(200)
  })

  it('generates a navigation-only worker with the exact asset precache', async () => {
    const response = await fetch('/sw.js')
    const worker = await response.text()
    const precacheUrls = [...worker.matchAll(/["']?url["']?\s*:\s*["']([^"']+)["']/g)].map(match => match[1])

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('public, max-age=0, must-revalidate')
    expect(precacheUrls.sort(), worker).toEqual([
      'apple-touch-icon.png',
      'favicon.ico',
      'offline.html',
      'pwa-192x192.png',
      'pwa-512x512.png',
      'pwa-maskable-512x512.png',
    ])
    expect(worker).toContain('NetworkOnly')
    expect(worker).toContain('PrecacheFallbackPlugin')
    expect(worker).toContain('/offline.html')
    expect(worker).toContain('navigate')
    expect(worker).toMatch(/\.enable\(\)/)
    expect(worker).not.toMatch(/\/api\/|\/_og\/|ipma|mapbox/i)
  })
})

describe('cache storage', () => {
  it('round-trips through the filesystem-backed test storage', async () => {
    expect(await $fetch('/api/cache-smoke')).toEqual({ ok: true })
  })
})

describe('OG image security', () => {
  it('renders the signed image URL emitted by the page', async () => {
    const page = await html('/maps/acores')
    const imageUrl = tag(page, 'og:image')
    expect(imageUrl).toBeTruthy()

    const path = new URL(imageUrl!).pathname + new URL(imageUrl!).search
    const response = await fetch(path)
    const body = await response.arrayBuffer()
    const png = new DataView(body)

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('image/png')
    expect(Number(response.headers.get('content-length') ?? body.byteLength)).toBeGreaterThan(1000)
    expect(body.byteLength).toBeGreaterThan(1000)
    expect(png.getUint32(16)).toBe(1200)
    expect(png.getUint32(20)).toBe(630)
  })

  it('rejects missing and tampered signatures', async () => {
    const page = await html('/maps')
    const imagePath = new URL(tag(page, 'og:image')!).pathname
    const unsignedPath = imagePath.replace(/,s_[^/.]+(?=\.png$)/, '')
    const tamperedPath = imagePath.replace(/,s_([^/.]+)(?=\.png$)/, ',s_invalid$1')

    expect((await fetch(unsignedPath)).status).toBe(403)
    expect((await fetch(tamperedPath)).status).toBe(403)
  })

  it('rejects oversized queries and unauthorized hosts', async () => {
    const page = await html('/maps')
    const imagePath = new URL(tag(page, 'og:image')!).pathname

    expect((await fetch(`${imagePath}?value=${'x'.repeat(2100)}`)).status).toBe(400)
    expect((await fetch(imagePath, { headers: { 'x-forwarded-host': 'attacker.example' } })).status).toBe(403)
  })
})
