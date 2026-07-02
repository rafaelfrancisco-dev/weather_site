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

1. **`defineCachedFunction` maxAge** (`server/utils/ipma.ts`) — per-function cache duration, backed by Redis in production (`nitro.storage.cache` in `nuxt.config.ts`) and filesystem in dev (`nitro.devStorage.cache`). The Redis driver is given an explicit `ttl: 90000` (25h) because all cached functions use the default `swr: true`, and Nitro only forwards a per-entry TTL to the storage driver when `swr: false` — without the driver-level ttl, Redis entries would never expire and would grow unbounded.
2. **`routeRules` ISR** (`nuxt.config.ts`) — `isr: <seconds>` per route, mapped by Nitro's vercel preset to real Vercel ISR expiration (the legacy `cache: { swr, maxAge }` shorthand does **not** work for this — it silently drops `maxAge`). ISR durations are set to roughly match the underlying data's cache maxAge so edge-served pages don't outlive the data they were built from.

### Routing & pages

- `app/pages/index.vue` immediately redirects (no render) to the user's last-viewed location (`useSettings().lastLocationId`), falling back to Lisboa, then the first location.
- `app/pages/location/[slug].vue` is the only real content page. The slug is `{id}-{slugified-name}` (see `shared/slug.ts`: `locationHref`/`parseLocationId`) — only the numeric id prefix is parsed/trusted; the name suffix is cosmetic/SEO only.
- `app/layouts/default.vue` is the shell: blocks render on `useLocationsData()` bootstrap, then renders `AppHeader` + `RegionTree` (sidebar) + `<main><slot /></main>`.

### Data fetching pattern

- `useLocationsData()` (`app/composables/useLocationsData.ts`) bootstraps all "global" data (locations, districts, warnings, weather-type descriptions, stations+observations) in one `useAsyncData` call, fanned out via `Promise.all` over the `/api/*` endpoints. This is shared/deduped across components via the `useAsyncData` key.
- `useLocationForecast(id, lang, t)` (`app/composables/useLocationForecast.ts`) fetches the per-location forecast **client-side only** (inside `if (import.meta.client)`), deliberately not blocking on `await` so Suspense resolves immediately on navigation. It keeps a `useState`-backed in-memory cache (`ipma-forecast-client-cache`) keyed by location id, cancels in-flight requests via `AbortController` when the selected location changes, and guards against race conditions with a `requestId` counter.
- `usePrefetchForecast()` (same file) lets the sidebar (`RegionTree.vue`, via `@mouseenter`/`@touchstart`) start fetching a location's forecast ahead of the click that navigates there, sharing the same cache/inflight `useState`. Best-effort: errors are swallowed since the real navigation fetch will retry and surface them.
- All derived/presentational data (the location tree, daily rows, hourly grid, observation grid, warning banners) is computed by pure functions in `app/utils/transform.ts` from the raw IPMA types — components themselves stay thin.

### Styling

There is no CSS framework and almost no `<style>` blocks — styling is inline `:style`/`style` bindings throughout, using OKLCH colors (e.g. `oklch(0.975 0.004 250)`). Color/threshold logic (temperature, precipitation, wind, UV, warning levels) is centralized in `app/utils/colors.ts`; reuse those helpers rather than inlining new color logic. `app/composables/useSettings.ts` persists user-facing theme/density/language/last-location state to `localStorage` via `useLocalStorage`.

### i18n

There is no i18n module — `app/utils/i18n.ts` exports a `strings(lang)` lookup and date-formatting helpers (`weekday`, `monthShort`, etc.) for the two supported languages (`en`, `pt`), driven by `useSettings().lang`.
