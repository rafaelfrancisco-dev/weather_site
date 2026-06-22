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
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; height: 100%; }
body { font-family: 'IBM Plex Sans', system-ui, sans-serif; background: oklch(0.975 0.004 250); color: oklch(0.24 0.012 255); -webkit-font-smoothing: antialiased; }
::-webkit-scrollbar { height: 10px; width: 10px; }
::-webkit-scrollbar-thumb { background: oklch(0.84 0.01 255); border-radius: 6px; }
::-webkit-scrollbar-track { background: transparent; }
</style>
