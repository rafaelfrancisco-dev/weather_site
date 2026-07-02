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
  runtimeConfig: {
    public: {
      mapboxToken: ''  // set via NUXT_PUBLIC_MAPBOX_TOKEN env var
    }
  },
  css: ['mapbox-gl/dist/mapbox-gl.css'],
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
    enabled: true
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
    // Baseline security headers on every response. The CSP ships as
    // Report-Only for now: it surfaces violations in the console/reports
    // without blocking anything, so the policy can be tuned on real traffic
    // before flipping it to an enforced Content-Security-Policy. Directives:
    // worker-src/child-src blob: + 'wasm-unsafe-eval' for mapbox-gl v3,
    // script-src 'unsafe-inline' for Nuxt's window.__NUXT__ payload,
    // style-src 'unsafe-inline' for the inline-style approach, and the
    // Google Fonts hosts because googleFonts.download is false.
    '/**': {
      headers: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy-Report-Only': "default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://www.ipma.pt https://api.mapbox.com; worker-src 'self' blob:; child-src blob:; connect-src 'self' https://api.mapbox.com https://events.mapbox.com; base-uri 'self'; form-action 'self'"
      }
    },
    '/location/**': { isr: 600 },
    '/api/locations': { isr: 86400 },
    '/api/districts': { isr: 86400 },
    '/api/weather-types': { isr: 86400 },
    '/api/warnings': { isr: 600 },
    '/api/observations': { isr: 3600 },
    '/api/forecast/**': { isr: 3600 },
    '/api/map-forecast': { isr: 3600 },
    '/maps': { isr: 600 },
    '/maps/**': { isr: 600 }
  },
  modules: ['@vueuse/nuxt', '@nuxtjs/google-fonts', '@nuxtjs/seo', '@vercel/analytics', '@vercel/speed-insights']
})
