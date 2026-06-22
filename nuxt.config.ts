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
  experimental: {
    viewTransition: true
  },
  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap' }
      ]
    }
  },
  nitro: {
    serverAssets: [{ baseName: 'ipma', dir: ipmaWasmDir }],
    storage: {
      cache: { driver: 'redis', url: process.env.REDIS_URL }
    },
    devStorage: {
      cache: { driver: 'fs', base: './.data/cache' }
    }
  },
  // CDN-cache these alongside the Redis TTLs in server/utils/ipma.ts so repeat
  // requests are served by Vercel's edge instead of invoking the function.
  routeRules: {
    '/api/locations': { cache: { swr: true, maxAge: 86400 } },
    '/api/districts': { cache: { swr: true, maxAge: 86400 } },
    '/api/weather-types': { cache: { swr: true, maxAge: 86400 } },
    '/api/warnings': { cache: { swr: true, maxAge: 600 } },
    '/api/observations': { cache: { swr: true, maxAge: 3600 } },
    '/api/forecast/**': { cache: { swr: true, maxAge: 3600 } }
  },
  modules: ['@vercel/analytics', '@vercel/speed-insights']
})
