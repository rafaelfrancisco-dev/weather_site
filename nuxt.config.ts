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
  modules: ['@vercel/analytics', '@vercel/speed-insights']
})
