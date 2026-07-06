# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start dev server (`http://localhost:3000`)
- `npm run build` — production build; **use this to validate TypeScript compiles**, since `npx nuxi typecheck` is currently broken in this repo (`@nuxt/devtools` fails to dynamically import vite during `loadNuxt`)
- `npm run generate` / `npm run preview` — static generate / preview a production build locally
- `npm test` — runs the Vitest unit suite (`vitest.config.ts`, tests under `tests/unit/**/*.spec.ts`) against the pure transform/util modules (`app/utils/*Transform.ts`, `colors.ts`, `shared/slug.ts`). Runs with `TZ=Europe/Lisbon` since date/weekday formatting in those modules is local-time-based. Component/composable behavior is not covered — verify UI changes manually per the guidance below.

### Install quirk

Plain `npm install` fails with an ERESOLVE conflict: `@vercel/speed-insights@2.0.0` peer-depends on `vue-router@^4`, but this project uses `vue-router@^5.1.0`. If install errors on this, or `nuxt dev`/`nuxt build` errors with `Cannot find package 'vite'` (vite ends up un-hoisted in `node_modules`), run `npm install --force` — this is a known-safe workaround for an upstream peer-range lag, not a real incompatibility.

The private package `@rafaelfrancisco-dev/ipma-weather-js` is installed from GitHub Packages (see `.npmrc`); installing requires `GITHUB_PACKAGES_TOKEN` in the environment.

## Architecture

This is **MET·PT**, a Nuxt 4 / Vue 3 / Vue Router 5 app showing Portuguese weather forecasts, observations, and warnings sourced from IPMA, deployed on Vercel.

### Data layer: IPMA client via WASM

- `@rafaelfrancisco-dev/ipma-weather-js` (Rust/WASM) is the actual IPMA client. `server/utils/ipma.ts` lazily compiles the wasm module once per warm server instance and exposes cached wrapper functions (`cachedLocations`, `cachedDistricts`, `cachedWeatherTypes`, `cachedWarnings`, `cachedStations`, `cachedObservations`, `cachedForecast`) built with Nitro's `defineCachedFunction`.
- The wasm binary is **not committed**. `nuxt.config.ts` resolves it at config-eval time (plain Node, before Nitro rewrites `import.meta.resolve`) and stages it as a Nitro server asset (`useStorage('assets:ipma')`) so it ships with the deployed function.
- Type definitions for the wasm exports live in `shared/ipma-types.ts` (`JSLocation`, `JSDistrict`, `JSWeatherWarning`, `JSAggregateForecastDay`, `JSHourlyForecastPeriod`, `JSStation`, `JSStationObservation`, `JSLookupDescription`).

### Caching: two layers must stay in sync

There are two independent caching mechanisms that are intentionally tuned together — when changing one, check the other:

1. **`defineCachedFunction` maxAge** (`server/utils/ipma.ts`) — per-function cache duration, backed by Redis in production (`nitro.storage.cache` in `nuxt.config.ts`) and filesystem in dev (`nitro.devStorage.cache`). The Redis driver is given an explicit `ttl: 90000` (25h) because all cached functions use the default `swr: true`, and Nitro only forwards a per-entry TTL to the storage driver when `swr: false` — without the driver-level ttl, Redis entries would never expire and would grow unbounded. This layer is unrelated to Vercel ISR cost: it's what stops every deploy-triggered ISR regeneration from hitting IPMA's real upstream API, since Redis persists across deployments while ISR's own cache does not (see below) — don't remove it as an "ISR is enough" simplification.
2. **`routeRules` ISR** (`nuxt.config.ts`) — `isr: <seconds>` per route, mapped by Nitro's vercel preset to real Vercel ISR expiration (the legacy `cache: { swr, maxAge }` shorthand does **not** work for this — it silently drops `maxAge`). ISR durations are set to roughly match the underlying data's cache maxAge so edge-served pages don't outlive the data they were built from. `/location/**`, `/api/warnings`, `/maps`, `/maps/**` are pinned to `3600` rather than something shorter: Vercel resets the entire ISR cache on every deployment, and this project deploys often, so a short window multiplies write volume fast across the ~300+ per-location paths. `/location/**`/`/maps/**` also SSR-render warnings data (banner, sidebar dots, fire-risk layer), so `cachedWarnings`' maxAge is matched to the same `3600` — warnings freshness is intentionally capped at 1h as a write-volume/freshness tradeoff. Don't shorten either side without reconsidering the other.

`cachedObservations`/`/api/observations` are the exception, running `600`/`600` rather than `3600`: station observations are the most time-sensitive data on the site and are fetched client-side only, via their own `ipma-observations` `useAsyncData` in `useLocationsData.ts` (see below), never baked into an ISR-rendered `/location/**` page, so a shorter window doesn't multiply per-deploy ISR write volume the way `/location/**`'s would. `useLocationsData()` revalidates on `visibilitychange` at two thresholds — `REVALIDATE_OBSERVATIONS_AFTER_MS` (10min, matched to the `600` above) for observations and `REVALIDATE_BOOTSTRAP_AFTER_MS` (1h, matched to warnings' `3600`) for the rest of the bootstrap — so a tab left open doesn't drift indefinitely on either axis; see the module-level `revalidationWired` guard there. Warnings freshness stays capped at 1h per the write-volume tradeoff above; don't lower `cachedObservations`/`/api/observations` without reconsidering both.

### Routing & pages

- `server/routes/index.get.ts` is a Nitro file route, which takes precedence over the Nuxt page renderer, so a hard load of `/` never boots Vue SSR: it reads the `metpt-last-location` cookie (`LAST_LOCATION_COOKIE` in `shared/slug.ts`), 307-redirects straight to that location (validated against `isValidLocationSlug`'s strict allowlist — the value is client-supplied and interpolated into a `Location` header) or `DEFAULT_LOCATION_PATH` (Lisboa) otherwise, and sets `Cache-Control: no-store` since the response varies per-cookie. `app/pages/location/[slug].vue` writes the cookie client-side (`import.meta.client`-gated — a server-side write would add `Set-Cookie` to ISR-cached responses) whenever the selected location changes.
- `app/pages/index.vue` only serves client-side router navigations to `/` (currently just `app/error.vue`'s `goHome()`, which also clears the cookie first so a stale cookie pointing at a removed location can't loop `/ → 404`) — it redirects to the user's last-viewed location (`useSettings().lastLocationId`), falling back to Lisboa, then the first location.
- `app/pages/location/[slug].vue` is the only real content page. The slug is `{id}-{slugified-name}` (see `shared/slug.ts`: `locationHref`/`parseLocationId`) — only the numeric id prefix is parsed/trusted; the name suffix is cosmetic/SEO only.
- `app/layouts/default.vue` is the shell: blocks render on `useLocationsData()` bootstrap, then renders `AppHeader` + `RegionTree` (sidebar) + `<main><slot /></main>`.

### Data fetching pattern

- `useLocationsData()` (`app/composables/useLocationsData.ts`) bootstraps "global" data in two separate `useAsyncData` calls sharing the same composable, deduped across components via their keys: `ipma-bootstrap` (locations, districts, warnings, weather-type descriptions, fanned out via `Promise.all` over the `/api/*` endpoints) and `ipma-observations` (stations+observations, `server: false, lazy: true` so it never blocks SSR or ships in the initial payload/hydration data — it's client-fetch-only, unlike the rest of the bootstrap). Observations were split out because they dominated the old combined payload (~87% of it) despite never being SSR-rendered; consumers read `observationsLoading` to show a loading state while the client-only fetch is in flight (e.g. `ObservationsTab.vue`).
- `useLocationForecast(id, lang, t)` (`app/composables/useLocationForecast.ts`) fetches the per-location forecast **client-side only** (inside `if (import.meta.client)`), deliberately not blocking on `await` so Suspense resolves immediately on navigation. It keeps a `useState`-backed in-memory cache (`ipma-forecast-client-cache`) keyed by location id, cancels in-flight requests via `AbortController` when the selected location changes, and guards against race conditions with a `requestId` counter.
- `usePrefetchForecast()` (same file) lets the sidebar (`RegionTree.vue`, via `@mouseenter`) start fetching a location's forecast ahead of desktop clicks, sharing the same cache/inflight `useState`. Touch navigation relies on the real navigation fetch to avoid scroll-triggered requests. Best-effort: errors are reported to Sentry but otherwise swallowed in the UI, since the real navigation fetch will retry and surface them.
- All derived/presentational data (the location tree, daily rows, hourly grid, observation grid, warning banners) is computed by pure functions in `app/utils/transform.ts` from the raw IPMA types — components themselves stay thin.

### Styling

There is no CSS framework; inline `:style`/`style` bindings remain the default for one-off component styling, using OKLCH colors (e.g. `oklch(0.975 0.004 250)`). Responsive behavior should use scoped `<style>` media queries keyed to `MOBILE_MEDIA_QUERY` in `app/utils/breakpoint.ts`: `(max-width: 700px), ((pointer: coarse) and (max-width: 1024px))`. `useViewport()` is a matchMedia-backed singleton for JS-only consumers such as map heights, `inert`, and auto-scroll; it must not gate SSR-visible layout. Color/threshold logic (temperature, precipitation, wind, UV, warning levels) is centralized in `app/utils/colors.ts`; reuse those helpers rather than inlining new color logic. `app/composables/useSettings.ts` persists user-facing theme/density/language/last-location state to `localStorage` via `useLocalStorage`.

### i18n

There is no i18n module — `app/utils/i18n.ts` exports a `strings(lang)` lookup and date-formatting helpers (`weekday`, `monthShort`, etc.) for the two supported languages (`en`, `pt`), driven by `useSettings().lang`.

### SEO indexability requires `NUXT_SITE_URL`

`site.indexable` (`nuxt.config.ts`) is only `true` when `VERCEL_ENV === 'production'` **and** `NUXT_SITE_URL` is set — without `NUXT_SITE_URL` in the production Vercel env, the site ships `noindex` and broken canonical/sitemap URLs even in production. Set it to the real production URL (e.g. `https://weather-site.vercel.app`) via `vercel env add NUXT_SITE_URL production`.

### Error reporting: Sentry (`@sentry/nuxt`)

- Configured via `nuxt.config.ts` (`sentry: { ... }`, plus root-level `sourcemap: { client: 'hidden' }` for readable-but-unlisted client stack traces) and two root-level config files, `sentry.client.config.ts` / `sentry.server.config.ts`, each calling `Sentry.init()` directly (the DSN is a public value, hardcoded). Both are errors-only (`tracesSampleRate: 0`, no Replay/Feedback) and disabled outside production/preview.
- `sentry.client.config.ts` reads `useRuntimeConfig().public.vercelEnv` rather than `process.env.VERCEL_ENV` directly — Vite doesn't expose arbitrary `process.env` vars to the client bundle, but this file runs inside a Nuxt plugin context (per the SDK), so `useRuntimeConfig()`/other Nuxt auto-imports work despite living at the repo root.
- **Server-side Sentry does not run under `nuxt dev`** — this is a documented SDK limitation (no `--import` hook in dev), not a bug. `autoInjectServerSentry: 'top-level-import'` is used instead, since Vercel's serverless runtime doesn't support the `node --import` flag; it gives basic http-level tracing only, which is fine since tracing is disabled anyway.
- Source-map upload needs `SENTRY_AUTH_TOKEN` + `SENTRY_ORG` + `SENTRY_PROJECT` in the Vercel env; without them the build just skips uploading (module warns, doesn't fail).
- Convention: catch sites that deliberately swallow errors (background revalidation, best-effort prefetch, per-location map-forecast failures) call `Sentry.captureException(error)` before falling back, so silent failures are still visible somewhere. Follow this pattern for any new best-effort catch block — don't add a truly silent `catch {}`/`.catch(() => {})`.

### Health endpoint

`server/api/health.get.ts` returns `{ ok, wasm, cache }` — `wasm` checks the IPMA wasm client can load (`isIpmaClientReady()` in `server/utils/ipma.ts`), `cache` round-trips a ping key on `useStorage('cache')`. Deliberately never calls the real IPMA upstream API, so an uptime monitor probing it doesn't consume IPMA's rate limits or reflect IPMA's own downtime as this app's downtime. `Cache-Control: no-store`. No external monitor is wired up to it yet.
