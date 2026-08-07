<script setup lang="ts">
import { accentColors } from '~/utils/colors'

const settings = useSettings()
// Client-only chrome, so it sits outside the SSR/hydration divergence hazard
// that useSettings.ts warns about — nothing here is SSR-visible layout.
const loadingColor = computed(() => accentColors(settings.value.accent).primary)

useHead({
  titleTemplate: title => title === 'MET·PT' ? title : `${title} - MET·PT`,
  meta: [
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-title', content: 'MET·PT' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
  ],
  link: [
    { rel: 'apple-touch-icon', href: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
  ],
})

usePageSeoMeta({
  title: 'MET·PT',
  description: 'Portugal weather forecasts, observations, and warnings from IPMA.',
  imageTitle: 'MET·PT',
  imageDescription: 'Portugal weather forecasts, observations, and warnings from IPMA.',
})
</script>

<template>
  <NuxtPwaManifest />
  <NuxtLoadingIndicator :color="loadingColor" />
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style>
/* Shared style tokens. These are the high-repetition neutrals used across
   components; one-off shades stay inline. Semantic color logic (temperature,
   precipitation, warnings, …) lives in app/utils/colors.ts. Do not use these
   in Mapbox paint expressions (app/utils/weather-map/mapColors.ts) — Mapbox
   cannot resolve CSS custom properties. */
:root {
  --border: oklch(0.88 0.008 255);
  --border-subtle: oklch(0.94 0.006 255);
  --text-muted: oklch(0.5 0.01 255);
  --text-subtle: oklch(0.55 0.01 255);
  --text-faint: oklch(0.7 0.008 255);
  --text-heading: oklch(0.30 0.012 255);
  --bg-page: oklch(0.975 0.004 250);
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; height: 100%; }
body { font-family: 'IBM Plex Sans', system-ui, sans-serif; background: var(--bg-page); color: oklch(0.24 0.012 255); -webkit-font-smoothing: antialiased; }

@media (hover: hover) and (pointer: fine) {
  ::-webkit-scrollbar { height: 10px; width: 10px; }
  ::-webkit-scrollbar-thumb { background: oklch(0.84 0.01 255); border-radius: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
}
</style>
