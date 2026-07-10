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
