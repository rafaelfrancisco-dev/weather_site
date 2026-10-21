# MET.PT

Nuxt 4 / Vue 3 weather app for Portugal. It shows IPMA forecasts, observations, warnings, and national or district weather maps, with a Vercel deployment target and Redis-backed Nitro cache.

## What It Does

- Redirects `/` to the last viewed location via a client-written cookie, falling back to Lisboa.
- Serves canonical location pages at `/location/{id}-{slug}` with SSR forecast content for the first load and async client-side forecast loading for later navigation.
- Provides weather maps at `/maps` and `/maps/{districtSlug}` with layers for temperature, warnings, fire risk, wind, UV, and precipitation.
- Fetches locations, districts, forecasts, observations, warnings, and weather types from IPMA through the private `@rafaelfrancisco-dev/ipma-weather-js` Rust/WASM package.
- Uses Nuxt SEO, Sentry error and performance monitoring, Vercel Analytics, and Vercel Speed Insights.
- Is installable as a PWA, with network-only pages and a branded bilingual offline fallback.

## Requirements

- Node `^20.19.0` or `>=22.12.0`
- npm
- `GITHUB_PACKAGES_TOKEN` with access to `@rafaelfrancisco-dev/ipma-weather-js`
- Optional for maps: `NUXT_PUBLIC_MAPBOX_TOKEN`
- Optional for production SEO: `NUXT_SITE_URL`
- Required for Vercel deployments: `NUXT_OG_IMAGE_SECRET`
- Optional for production cache: `REDIS_URL`
- Optional for source-map upload: `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`

## Setup

Install dependencies:

```bash
npm install
```

If dependency installation fails with the known `@vercel/speed-insights` / `vue-router` peer range conflict, or if Nuxt later cannot find `vite`, use:

```bash
npm install --force
```

The private IPMA package is installed from GitHub Packages through `.npmrc`, so `GITHUB_PACKAGES_TOKEN` must be present in the environment before installing.

## Development

Start the app at `http://localhost:3000`:

```bash
npm run dev
```

Run the unit and Nuxt integration tests:

```bash
npm test
```

Build for production:

```bash
npm run build
```

Preview a production build locally:

```bash
npm run preview
```

Static generation is available through:

```bash
npm run generate
```

## Project Layout

- `app/pages/location/[slug].vue` - canonical location page with forecast and observations tabs.
- `app/pages/maps.vue` and `app/pages/maps/[districtSlug].vue` - weather maps entry points.
- `app/components/WeatherMapsPage.vue` and `app/components/WeatherMap.vue` - map UI and rendering.
- `app/composables/useLocationsData.ts` - shared bootstrap data and client-only observations fetch.
- `app/composables/useLocationForecast.ts` - initial SSR forecast plus async client navigation forecast cache.
- `app/utils/*Transform.ts` - pure data transforms for forecast, observation, and location presentation.
- `server/routes/index.ts` - hard-load root redirect.
- `server/api/*.get.ts` - IPMA-backed API endpoints.
- `server/utils/ipma.ts` - WASM client loading and Nitro cached functions.

## Data And Caching

The IPMA WASM package is resolved in `nuxt.config.ts` and staged as a Nitro server asset. Runtime server code loads it from `useStorage('assets:ipma')`; the WASM binary is not committed.

Caching has two coordinated layers:

- Nitro `defineCachedFunction` caches in `server/utils/ipma.ts`, backed by Redis in production and filesystem storage in development.
- Nuxt `routeRules` use Vercel ISR for pages and API responses, with windows matched to the underlying data freshness.

Key cache windows:

- Locations, districts, weather types, and stations: `86400` seconds.
- Forecasts, warnings, map forecast, `/location/**`, `/maps`, and `/maps/**`: `3600` seconds.
- Observations and `/api/observations`: `600` seconds.

The cached functions intentionally use `swr: false` so expired Redis entries refresh synchronously and receive per-entry TTLs. Do not shorten ISR or Redis cache windows independently; update both layers together.

## SEO And Deployment

`site.indexable` is only true when `VERCEL_ENV=production` and `NUXT_SITE_URL` is set. Production deployments without `NUXT_SITE_URL` will emit `noindex` and incomplete canonical/sitemap URLs.

Set the production site URL, for example:

```bash
vercel env add NUXT_SITE_URL production
```

Runtime Open Graph images use signed URLs. Generate a stable signing secret and
configure the same value for Vercel Preview and Production deployments:

```bash
npx nuxt-og-image generate-secret
vercel env add NUXT_OG_IMAGE_SECRET preview
vercel env add NUXT_OG_IMAGE_SECRET production
```

Local development and builds use a local-only fallback signing key when the
environment variable is absent. Vercel deployments fail configuration if the
secret is missing.

The health endpoint is `/api/health`. It checks local WASM loading and cache storage only; it does not call IPMA upstream.

## PWA

The service worker never caches weather data, APIs, SSR pages, Open Graph
images, fonts, Nuxt chunks, or Mapbox traffic. It only supplies the install
manifest and a small explicit precache for the standalone offline fallback and
icons. See [PWA operations](docs/pwa.md) for the Preview acceptance checklist
and the required cleanup-worker rollback procedure.

## Notes For Changes

- Keep per-user state client-only. Settings and the last location are persisted after hydration to avoid ISR and hydration mismatches.
- Keep swallowed best-effort errors visible through `Sentry.captureException`.
- Prefer the pure transform utilities for derived weather data instead of moving formatting logic into components.
- `npm run build` is the practical TypeScript validation path for this repo.
