<script setup lang="ts">
import { locationHref } from '#shared/slug'

const settings = useSettings()
const { locations, bootstrapped } = useLocationsData()
const readyToRedirect = ref(false)
const target = computed(() => locations.value.find(l => l.id === settings.value.lastLocationId)
  ?? locations.value.find(l => l.name === 'Lisboa')
  ?? locations.value[0])

onMounted(() => {
  readyToRedirect.value = true
})

if (import.meta.client) {
  watchEffect(async () => {
    if (!readyToRedirect.value || !bootstrapped.value || !target.value) return
    await navigateTo(locationHref(target.value.id, target.value.name), { replace: true })
  })
}
</script>

<template>
  <div v-if="bootstrapped && !target" style="color:oklch(0.4 0.012 255); font-size:14px;">No locations found.</div>
</template>
