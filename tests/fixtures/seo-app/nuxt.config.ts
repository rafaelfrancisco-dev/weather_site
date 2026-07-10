import { fileURLToPath } from 'node:url'

const projectRoot = fileURLToPath(new URL('../../..', import.meta.url))

export default defineNuxtConfig({
  extends: [projectRoot],
  alias: {
    '~': fileURLToPath(new URL('../../../app', import.meta.url)),
    '@': projectRoot,
    '#shared': fileURLToPath(new URL('../../../shared', import.meta.url)),
  },
  site: {
    url: 'https://weather.test',
    name: 'MET·PT',
    description: 'Portugal weather forecasts, observations, and warnings from IPMA.',
    defaultLocale: 'en',
    indexable: true,
  },
  googleFonts: {
    download: false,
  },
  routeRules: {
    '/**': { isr: false },
  },
})
