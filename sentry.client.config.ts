import * as Sentry from '@sentry/nuxt'

// Capture every trace in Preview so deployments are easy to verify, then keep
// Production volume bounded at 10%. Replay/Feedback remain disabled. The SDK
// automatically adds Nuxt router tracing after this config initializes it.
//
// This file runs inside a Nuxt plugin context (per @sentry/nuxt), so
// useRuntimeConfig() is available here despite being a top-level Sentry
// config file — used instead of process.env.VERCEL_ENV since Vite doesn't
// expose arbitrary process.env vars to the client bundle.
const environment = useRuntimeConfig().public.vercelEnv

Sentry.init({
  dsn: 'https://d7c8711fa1f0811e151a19ef9ebbb28f@o270518.ingest.us.sentry.io/4511688352399360',
  environment,
  enabled: import.meta.env.PROD,
  tracesSampleRate: environment === 'production' ? 0.1 : 1.0
})

Sentry.metrics.count('user_action', 1);
Sentry.metrics.distribution('api_response_time', 150);
