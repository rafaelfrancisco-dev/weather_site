import * as Sentry from '@sentry/nuxt'

// Errors only: tracesSampleRate 0 disables performance monitoring, and no
// Replay/Feedback integrations are added, to keep the client bundle small
// (~25-30 KB gzip for error capture alone). Disabled in dev so local errors
// don't pollute the Sentry project.
//
// This file runs inside a Nuxt plugin context (per @sentry/nuxt), so
// useRuntimeConfig() is available here despite being a top-level Sentry
// config file — used instead of process.env.VERCEL_ENV since Vite doesn't
// expose arbitrary process.env vars to the client bundle.
Sentry.init({
  dsn: 'https://d7c8711fa1f0811e151a19ef9ebbb28f@o270518.ingest.us.sentry.io/4511688352399360',
  environment: useRuntimeConfig().public.vercelEnv,
  enabled: import.meta.env.PROD,
  tracesSampleRate: 0
})
