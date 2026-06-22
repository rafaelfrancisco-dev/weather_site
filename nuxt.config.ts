import { mkdirSync, copyFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

// Nitro rewrites `import.meta.resolve`/`import.meta.url` inside bundled server
// chunks, so resolving the wasm binary at runtime (server/utils/ipma.ts) isn't
// reliable across deploy targets. Resolve it here instead, while this config
// still runs as plain Node, and stage it as a Nitro server asset so it ships
// with the function without being committed to the repo.
const ipmaWasmDir = fileURLToPath(new URL('./.nitro/ipma-wasm', import.meta.url))
mkdirSync(ipmaWasmDir, { recursive: true })
copyFileSync(
  fileURLToPath(import.meta.resolve('@rafaelfrancisco-dev/ipma-weather-js/wasm')),
  join(ipmaWasmDir, 'ipma-weather-js.wasm')
)

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  app: {
    head: {
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }]
    }
  },
  site: {
    url: process.env.NUXT_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined),
    name: 'MET·PT',
    description: 'Portugal weather forecasts, observations, and warnings from IPMA.',
    defaultLocale: 'en',
    indexable: process.env.VERCEL_ENV === 'production' && Boolean(process.env.NUXT_SITE_URL)
  },
  googleFonts: {
    families: {
      'IBM Plex Sans': [400, 500, 600, 700],
      'IBM Plex Mono': [400, 500, 600]
    },
    display: 'swap',
    preconnect: true,
    download: false
  },
  robots: {
    mergeWithRobotsTxtPath: false
  },
  ogImage: {
    enabled: false
  },
  schemaOrg: {
    enabled: false
  },
  sitemap: {
    sources: ['/api/__sitemap__/urls'],
    cacheMaxAgeSeconds: 3600,
    discoverImages: false,
    discoverVideos: false
  },
  nitro: {
    serverAssets: [{ baseName: 'ipma', dir: ipmaWasmDir }],
    storage: {
      // Nitro only forwards a per-entry TTL to the storage driver when a
      // cached function sets `swr: false` (see nitropack's cache.mjs) — all
      // of the defineCachedFunction calls in server/utils/ipma.ts use the
      // default swr: true, so without a driver-level ttl here, entries never
      // get a Redis EX and live forever, filling a capacity-limited Redis.
      // 90000s (25h) comfortably outlives the longest maxAge in use (86400s)
      // so Redis never evicts an entry before the app would've refreshed it.
      cache: { driver: 'redis', url: process.env.REDIS_URL, ttl: 90000 }
    },
    devStorage: {
      cache: { driver: 'fs', base: './.data/cache' }
    }
  },
  // ISR-cache these alongside the Redis TTLs in server/utils/ipma.ts so repeat
  // requests are served by Vercel's edge instead of invoking the function.
  // `isr: <seconds>` (not the legacy `cache: { swr, maxAge }` shorthand) is
  // what Nitro's vercel preset actually maps to a real ISR expiration —
  // the legacy shorthand silently drops maxAge and never time-based-revalidates.
  routeRules: {
    '/': { isr: 86400 },
    '/location/**': { isr: 600 },
    '/api/locations': { isr: 86400 },
    '/api/districts': { isr: 86400 },
    '/api/weather-types': { isr: 86400 },
    '/api/warnings': { isr: 600 },
    '/api/observations': { isr: 3600 },
    '/api/forecast/**': { isr: 3600 }
  },
  modules: ['@vueuse/nuxt', '@nuxtjs/google-fonts', '@nuxtjs/seo', '@vercel/analytics', '@vercel/speed-insights']
})
