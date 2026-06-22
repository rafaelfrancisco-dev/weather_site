<script setup lang="ts">
import { strings } from '~/utils/i18n'
import { accentColors } from '~/utils/colors'
import { parseLocationId } from '#shared/slug'

const route = useRoute()
const tab = ref<'forecast' | 'obs'>('forecast')

const { mobile } = useViewport()
const settings = useSettings()
const { locations, bootstrapped } = useLocationsData()

const lang = computed(() => settings.value.lang)
const t = computed(() => strings(lang.value))
const c = computed(() => accentColors(settings.value.accent))

const id = computed(() => parseLocationId(route.params.slug as string))
const found = computed(() => id.value != null && locations.value.some(l => l.id === id.value))

watchEffect(() => {
  if (found.value && id.value != null) {
    settings.value.lastLocationId = id.value
  }
})

const {
  locationMeta,
  warningBanner,
  dailyRows,
  hourlyGrid,
  observationGrid
} = useLocationForecast(id, lang, t)

const tabs = computed(() => [
  { key: 'forecast' as const, label: t.value.forecast },
  { key: 'obs' as const, label: t.value.obs }
])

useSeoMeta({
  title: computed(() => locationMeta.value?.name ?? 'MET·PT'),
  description: computed(() => locationMeta.value
    ? `${locationMeta.value.name} weather forecast, observations, and warnings from IPMA.`
    : 'Portugal weather forecasts, observations, and warnings from IPMA.'),
  ogTitle: computed(() => locationMeta.value ? `${locationMeta.value.name} - MET·PT` : 'MET·PT'),
  ogDescription: computed(() => locationMeta.value
    ? `${locationMeta.value.name} weather forecast, observations, and warnings from IPMA.`
    : 'Portugal weather forecasts, observations, and warnings from IPMA.')
})
</script>

<template>
  <div v-if="!found && bootstrapped" style="color:oklch(0.55 0.21 27); font-size:14px;">
    Location not found. <NuxtLink to="/">Go back home</NuxtLink>
  </div>

  <template v-else>
    <LocationHeader :loc="locationMeta" :t="t" />
    <WarningBanner :data="warningBanner" />

    <div style="display:flex; gap:2px; border-bottom:1px solid oklch(0.88 0.008 255); margin-bottom:18px;">
      <button
        v-for="tb in tabs"
        :key="tb.key"
        :style="{ border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: tab === tb.key ? 600 : 500, color: tab === tb.key ? c.primary : 'oklch(0.5 0.01 255)', padding: '9px 15px', borderBottom: `2px solid ${tab === tb.key ? c.primary : 'transparent'}`, marginBottom: '-1px' }"
        @click="tab = tb.key"
      >{{ tb.label }}</button>
    </div>

    <ForecastTab v-if="tab === 'forecast'" :hourly-grid="hourlyGrid" :daily-rows="dailyRows" :mobile="mobile" :t="t" />
    <ObservationsTab v-if="tab === 'obs'" :observation-grid="observationGrid" :t="t" />
  </template>
</template>
