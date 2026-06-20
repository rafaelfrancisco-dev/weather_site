<script setup lang="ts">
import type { LocationMeta } from '~/utils/transform'

const props = defineProps<{
  loc: LocationMeta | null
  t: Record<string, string>
}>()
</script>

<template>
  <div v-if="props.loc" style="display:flex; align-items:flex-end; justify-content:space-between; gap:16px; flex-wrap:wrap; margin-bottom:14px;">
    <div>
      <div style="font-size:11px; font-weight:500; color:oklch(0.55 0.01 255); letter-spacing:0.02em; margin-bottom:2px;">{{ props.loc.region }} · {{ props.loc.district }}</div>
      <h1 style="margin:0; font-size:27px; font-weight:700; letter-spacing:-0.01em; color:oklch(0.22 0.014 255);">{{ props.loc.name }}</h1>
    </div>
    <div style="text-align:right; font-family:'IBM Plex Mono', monospace; font-size:11px; color:oklch(0.5 0.01 255); line-height:1.7;">
      <div>{{ props.loc.coord }}</div>
      <div>{{ props.t.updated }} {{ props.loc.updated }}</div>
    </div>
  </div>
</template>
