<script setup lang="ts">
useHead({
  titleTemplate: title => title === 'MET·PT' ? title : `${title} - MET·PT`
})

useSeoMeta({
  title: 'MET·PT',
  description: 'Portugal weather forecasts, observations, and warnings from IPMA.',
  ogTitle: 'MET·PT',
  ogDescription: 'Portugal weather forecasts, observations, and warnings from IPMA.',
  ogType: 'website',
  twitterCard: 'summary'
})
</script>

<template>
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
::-webkit-scrollbar { height: 10px; width: 10px; }
::-webkit-scrollbar-thumb { background: oklch(0.84 0.01 255); border-radius: 6px; }
::-webkit-scrollbar-track { background: transparent; }
</style>
