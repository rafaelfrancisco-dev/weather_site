import * as Sentry from '@sentry/nuxt'

// Errors only (tracesSampleRate: 0) — see sentry.client.config.ts for the
// rationale. Disabled outside production so local `nuxt dev` runs don't
// report. Note: this file is a documented SDK limitation — it does not run
// during `nuxt dev`, only in built/deployed server bundles.
Sentry.init({
  dsn: 'https://d7c8711fa1f0811e151a19ef9ebbb28f@o270518.ingest.us.sentry.io/4511688352399360',
  environment: process.env.VERCEL_ENV ?? 'development',
  enabled: process.env.VERCEL_ENV === 'production' || process.env.VERCEL_ENV === 'preview',
  tracesSampleRate: 0
})

Sentry.metrics.count('user_action', 1);
Sentry.metrics.distribution('api_response_time', 150);