// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
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
