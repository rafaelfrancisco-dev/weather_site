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
      mapboxToken: '',  // set via NUXT_PUBLIC_MAPBOX_TOKEN env var
      // Baked in at build time so sentry.client.config.ts can tag events with
      // it — Vite doesn't expose arbitrary process.env vars to the client
      // bundle, but sentry.client.config.ts runs inside a Nuxt plugin context
      // (per @sentry/nuxt), so useRuntimeConfig() works there.
      vercelEnv: process.env.VERCEL_ENV ?? 'development'
    }
  },
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
    download: true
  },
  robots: {
    mergeWithRobotsTxtPath: false
  },
  ogImage: {
    enabled: true,
    cacheMaxAgeSeconds: 3600,
    defaults: {
      component: 'OgImageMetPt',
      width: 1200,
      height: 630,
      renderer: 'satori',
      extension: 'png',
      cacheMaxAgeSeconds: 3600
    }
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
      // All defineCachedFunction calls in server/utils/ipma.ts (and
      // map-forecast.get.ts) set `swr: false`, so Nitro forwards a per-entry
      // TTL (`ttl: maxAge`) to the storage driver on every write (see
      // nitropack's cache.mjs) — that's what actually expires each key on
      // schedule. This driver-level ttl is just a backstop for keys written
      // without one (the health-check ping key, or any future cached
      // function that forgets swr: false) so they can't live in Redis
      // forever; 90000s (25h) comfortably outlives the longest maxAge in use
      // (86400s).
      cache: process.env.REDIS_URL
        ? { driver: 'redis', url: process.env.REDIS_URL, ttl: 90000 }
        : { driver: 'fs', base: './.data/cache', ttl: 90000 }
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
  //
  // /location/**, /api/warnings, /maps, /maps/** are pinned to 3600 (not a
  // shorter window) on purpose: every Vercel deployment resets the ISR cache
  // for all routes, and this project deploys often, so a short isr window
  // multiplies Vercel ISR write volume fast across the ~300+ per-location
  // paths. /location/** and /maps/** also SSR-render warnings data (banner,
  // sidebar dots, fire-risk layer), so their isr window is intentionally
  // matched to cachedWarnings' maxAge (server/utils/ipma.ts) — warnings
  // freshness is capped at 1h as a deliberate cost/freshness tradeoff.
  // Don't shorten these without reconsidering the write-volume impact.
  //
  // /api/observations is the exception, at 600 rather than 3600: station
  // observations are fetched client-side only, via their own 'ipma-observations'
  // useAsyncData in useLocationsData.ts (split out from the rest of the
  // 'ipma-bootstrap' fetch so observations — ~87% of the old combined payload —
  // don't ship on every page view), never baked into an ISR-rendered page, so
  // a shorter window doesn't multiply per-deploy ISR writes the way
  // /location/**'s would. Matched to cachedObservations' maxAge
  // (server/utils/ipma.ts) and to REVALIDATE_OBSERVATIONS_AFTER_MS in
  // useLocationsData.ts — keep all three in sync.
  //
  // `/` has no routeRule: server/routes/index.get.ts (a Nitro file route)
  // redirects hard loads straight to the last-visited location via a client
  // cookie, with its own `Cache-Control: no-store` since the response varies
  // per-cookie and must never be edge-cached.
  routeRules: {
    // Baseline security headers on every response. The CSP ships as
    // Report-Only for now: it surfaces violations in the console/reports
    // without blocking anything, so the policy can be tuned on real traffic
    // before flipping it to an enforced Content-Security-Policy. Directives:
    // worker-src/child-src blob: + 'wasm-unsafe-eval' for mapbox-gl v3,
    // script-src 'unsafe-inline' for Nuxt's window.__NUXT__ payload, and
    // style-src 'unsafe-inline' for the inline-style approach. Fonts are
    // self-hosted (googleFonts.download: true) so no Google Fonts hosts
    // are needed in style-src/font-src.
    '/**': {
      headers: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
        // connect-src includes the Sentry envelope endpoint (error reporting);
        // report-uri sends CSP violations there too, alongside JS errors, so
        // both land in the same dashboard. Still Report-Only — see comment above.
        'Content-Security-Policy-Report-Only': "default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob: https://www.ipma.pt https://api.mapbox.com; worker-src 'self' blob:; child-src blob:; connect-src 'self' https://api.mapbox.com https://events.mapbox.com https://o270518.ingest.us.sentry.io; base-uri 'self'; form-action 'self'; report-uri https://o270518.ingest.us.sentry.io/api/4511688352399360/security/?sentry_key=d7c8711fa1f0811e151a19ef9ebbb28f"
      }
    },
    '/fonts/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
    '/location/**': { isr: 3600 },
    '/api/locations': { isr: 86400 },
    '/api/districts': { isr: 86400 },
    '/api/weather-types': { isr: 86400 },
    '/api/warnings': { isr: 3600 },
    '/api/observations': { isr: 600 },
    '/api/forecast/**': { isr: 3600 },
    '/api/map-forecast': { isr: 3600 },
    '/maps': { isr: 3600 },
    '/maps/**': { isr: 3600 }
  },
  modules: ['@vueuse/nuxt', '@nuxtjs/google-fonts', '@nuxtjs/seo', '@vercel/analytics', '@vercel/speed-insights', '@sentry/nuxt/module'],
  // Hidden client source maps so stack traces resolve in Sentry without
  // shipping readable source to the browser.
  sourcemap: { client: 'hidden' },
  sentry: {
    // 'top-level-import' is the documented mode for serverless/Vercel, where
    // the `node --import` flag isn't available; it only supports basic
    // (http-level) tracing, which is fine since tracesSampleRate is 0 anyway
    // (see sentry.server.config.ts) — we want error capture, not APM.
    autoInjectServerSentry: 'top-level-import',
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    authToken: process.env.SENTRY_AUTH_TOKEN
  }
})
