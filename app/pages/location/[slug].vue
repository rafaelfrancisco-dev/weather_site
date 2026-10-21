<script setup lang="ts">
import { strings } from '~/utils/i18n'
import { accentColors } from '~/utils/colors'
import { LAST_LOCATION_COOKIE, locationHref, parseLocationId, slugify } from '#shared/slug'

const route = useRoute()
const tab = ref<'forecast' | 'obs'>('forecast')

const settings = useSettings()
const { locations, bootstrapped, observationsLoading } = useLocationsData()

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

// Client-only: settings is a module-level singleton (useSettings.ts) shared
// across requests on a warm serverless instance — writing it during SSR
// would leak one request's location into another's render. A server-side
// cookie write here would also add `Set-Cookie` to ISR-cached /location/**
// responses and break edge caching for everyone.
if (import.meta.client) {
  const lastLocationCookie = useCookie(LAST_LOCATION_COOKIE, { maxAge: 60 * 60 * 24 * 365, sameSite: 'lax', path: '/' })
  watchEffect(() => {
    if (found.value && id.value != null) {
      settings.value.lastLocationId = id.value
    }
    if (location.value) {
      lastLocationCookie.value = `${location.value.id}-${slugify(location.value.name)}`
    }
  })
}

const {
  locationMeta,
  warningBanner,
  dailyRows,
  hourlyGrid,
  meteogramModel,
  dailyRangeModel,
  observationGrid,
  forecastError,
  forecastLoading,
  retryForecast
} = useLocationForecast(id, lang, t)

// The raw fetch error may carry upstream/internal detail, so it isn't shown —
// same treatment as the bootstrap error in layouts/default.vue.
watch(forecastError, (err) => {
  if (err) console.error('[forecast]', err)
})

const seoTitle = computed(() => locationMeta.value?.name ?? 'MET·PT')
const seoDescription = computed(() => locationMeta.value
  ? `${locationMeta.value.name} weather forecast, observations, and warnings from IPMA.`
  : 'Portugal weather forecasts, observations, and warnings from IPMA.')
const imageDescription = computed(() => {
  if (!locationMeta.value) return seoDescription.value
  const warningLevel = warningBanner.value.hasWarn ? warningBanner.value.banner?.level : null
  return locationImageDescription(locationMeta.value.name, warningLevel)
})

const { canonicalUrl } = usePageSeoMeta({
  title: seoTitle,
  description: seoDescription,
  path: computed(() => canonicalPath.value ?? route.path),
  imageTitle: computed(() => locationMeta.value ? `${locationMeta.value.name} weather` : 'MET·PT'),
  imageDescription,
  eyebrow: 'Location forecast',
})

useHead({
  link: computed(() => canonicalUrl.value
    ? [{ rel: 'alternate', hreflang: 'x-default', href: canonicalUrl.value }]
    : []),
})

const tabs = computed(() => [
  { key: 'forecast' as const, label: t.value.forecast },
  { key: 'obs' as const, label: t.value.obs }
])
</script>

<template>
  <template v-if="found">
    <LocationHeader :loc="locationMeta" :t="t" />
    <WarningBanner :data="warningBanner" />

    <div class="location-tabs" style="display:flex; gap:2px; border-bottom:1px solid var(--border); margin-bottom:18px;">
      <button
        v-for="tb in tabs"
        :key="tb.key"
        class="location-tab"
        :style="{ border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: tab === tb.key ? 600 : 500, color: tab === tb.key ? c.primary : 'oklch(0.45 0.01 255)', padding: '9px 15px', borderBottom: `2px solid ${tab === tb.key ? c.primary : 'transparent'}`, marginBottom: '-1px' }"
        @click="tab = tb.key"
      >{{ tb.label }}</button>
    </div>

    <template v-if="tab === 'forecast'">
      <!-- Only the forecast pane is replaced: the header, warning banner, tab
           bar and Observations tab stay usable while this location's forecast
           is unavailable. -->
      <div
        v-if="forecastError"
        style="display:flex; flex-direction:column; align-items:center; gap:12px; padding:56px 20px; color:oklch(0.55 0.21 27); font-size:14px; text-align:center;"
      >
        <div>{{ t.forecastError }}</div>
        <button
          type="button"
          :disabled="forecastLoading"
          style="font-family:inherit; font-size:13px; font-weight:500; color:oklch(0.55 0.21 27); background:none; border:1px solid oklch(0.55 0.21 27); border-radius:6px; padding:7px 14px; cursor:pointer;"
          @click="retryForecast"
        >{{ t.retry }}</button>
      </div>

      <ForecastTab v-else :hourly-grid="hourlyGrid" :daily-rows="dailyRows" :meteogram="meteogramModel" :daily-range="dailyRangeModel" :primary="c.primary" :t="t" />
    </template>
    <ObservationsTab v-if="tab === 'obs'" :observation-grid="observationGrid" :t="t" :primary="c.primary" :soft="c.soft" :loading="observationsLoading" />
  </template>
</template>

<style scoped>
@media (max-width: 700px), ((pointer: coarse) and (max-width: 1024px)) {
  .location-tab {
    min-height: 44px;
  }
}
</style>
