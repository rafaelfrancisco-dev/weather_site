import * as Sentry from '@sentry/nuxt'

// Capture every trace in Preview so deployments are easy to verify, then keep
// Production volume bounded at 10%. Disabled outside Vercel Preview and
// Production. Note: this file is a documented SDK limitation — it does not run
// during `nuxt dev`, only in built/deployed server bundles.
const environment = process.env.VERCEL_ENV ?? 'development'

Sentry.init({
  dsn: 'https://d7c8711fa1f0811e151a19ef9ebbb28f@o270518.ingest.us.sentry.io/4511688352399360',
  environment,
  enabled: environment === 'production' || environment === 'preview',
  tracesSampleRate: environment === 'production' ? 0.1 : 1.0
})

Sentry.metrics.count('user_action', 1);
Sentry.metrics.distribution('api_response_time', 150);
