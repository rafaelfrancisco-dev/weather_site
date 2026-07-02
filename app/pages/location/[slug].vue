<script setup lang="ts">
import { strings } from '~/utils/i18n'
import { accentColors } from '~/utils/colors'
import { locationHref, parseLocationId } from '#shared/slug'

const route = useRoute()
const tab = ref<'forecast' | 'obs'>('forecast')

const { mobile } = useViewport()
const settings = useSettings()
const { locations, bootstrapped } = useLocationsData()

const lang = computed(() => settings.value.lang)
const t = computed(() => strings(lang.value))
const c = computed(() => accentColors(settings.value.accent))

const id = computed(() => parseLocationId(route.params.slug as string))
const location = computed(() => locations.value.find(l => l.id === id.value) ?? null)
const found = computed(() => location.value != null)

watchEffect(() => {
  if (bootstrapped.value && !found.value) {
    throw createError({ statusCode: 404, statusMessage: 'Location not found', fatal: true })
  }
})

// Only the numeric id prefix of the slug is trusted, so any suffix renders the
// same page — 301 stray variants to the canonical slug instead of serving
// duplicates, and declare it for crawlers.
const canonicalPath = computed(() => location.value ? locationHref(location.value.id, location.value.name) : null)
if (canonicalPath.value && route.path !== canonicalPath.value) {
  await navigateTo(canonicalPath.value, { redirectCode: 301, replace: true })
}

const site = useSiteConfig()
useHead({
  link: computed(() => {
    if (!canonicalPath.value || !site.url) return []
    const href = `${site.url.replace(/\/+$/, '')}${canonicalPath.value}`
    return [
      { rel: 'canonical', href },
      { rel: 'alternate', hreflang: 'x-default', href }
    ]
  })
})

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
  <template v-if="found">
    <LocationHeader :loc="locationMeta" :t="t" />
    <WarningBanner :data="warningBanner" />

    <div style="display:flex; gap:2px; border-bottom:1px solid var(--border); margin-bottom:18px;">
      <button
        v-for="tb in tabs"
        :key="tb.key"
        :style="{ border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: tab === tb.key ? 600 : 500, color: tab === tb.key ? c.primary : 'oklch(0.45 0.01 255)', padding: '9px 15px', borderBottom: `2px solid ${tab === tb.key ? c.primary : 'transparent'}`, marginBottom: '-1px' }"
        @click="tab = tb.key"
      >{{ tb.label }}</button>
    </div>

    <ForecastTab v-if="tab === 'forecast'" :hourly-grid="hourlyGrid" :daily-rows="dailyRows" :mobile="mobile" :t="t" />
    <ObservationsTab v-if="tab === 'obs'" :observation-grid="observationGrid" :t="t" :mobile="mobile" :primary="c.primary" :soft="c.soft" />
  </template>
</template>
