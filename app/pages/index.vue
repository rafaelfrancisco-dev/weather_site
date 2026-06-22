<script setup lang="ts">
import { locationHref } from '#shared/slug'

const { locations } = useLocationsData()
const target = locations.value.find(l => l.name === 'Lisboa') ?? locations.value[0]
if (target) {
  await navigateTo(locationHref(target.id, target.name), { replace: true })
}
</script>

<template>
  <div v-if="!target" style="color:oklch(0.4 0.012 255); font-size:14px;">No locations found.</div>
</template>
