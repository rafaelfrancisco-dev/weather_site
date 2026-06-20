<script setup lang="ts">
import type { Lang } from '~/utils/i18n'

const locId = ref<number | null>(null)
const tab = ref<'forecast' | 'obs'>('forecast')
const lang = ref<Lang>('en')
const query = ref('')
const vw = ref(1180)
const navOpen = ref(false)
const open = ref<Record<number, boolean>>({})

const mobile = computed(() => vw.value <= 700)

function onResize() {
  vw.value = window.innerWidth
}
onMounted(() => {
  onResize()
  window.addEventListener('resize', onResize)
})
onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})

const {
  ready,
  clientError,
  bootstrapped,
  bootstrapError,
  tree,
  locationMeta,
  warningBanner,
  dailyRows,
  hourlyGrid,
  obsRows,
  obsCards,
  t,
  c
} = useWeatherData({ lang, selectedId: locId, query, openMap: open })

function toggleNav() {
  navOpen.value = !navOpen.value
}
function closeNav() {
  navOpen.value = false
}
function toggleRegion(id: number) {
  const currentlyOpen = open.value[id] !== false
  open.value = { ...open.value, [id]: !currentlyOpen }
}
function selectLocation(id: number) {
  locId.value = id
  navOpen.value = false
}
function setLang(l: Lang) {
  lang.value = l
}

const tabs = computed(() => [
  { key: 'forecast' as const, label: t.value.forecast },
  { key: 'obs' as const, label: t.value.obs }
])

useHead({
  title: 'MET·PT',
  htmlAttrs: { lang }
})
</script>

<template>
  <div v-if="!ready" style="height:100vh; display:flex; align-items:center; justify-content:center; color:oklch(0.4 0.012 255); font-size:14px;">
    Loading weather engine…
  </div>
  <div v-else-if="clientError" style="height:100vh; display:flex; align-items:center; justify-content:center; color:oklch(0.55 0.21 27); font-size:14px;">
    {{ clientError }}
  </div>
  <div v-else-if="bootstrapError" style="height:100vh; display:flex; align-items:center; justify-content:center; color:oklch(0.55 0.21 27); font-size:14px;">
    {{ bootstrapError }}
  </div>
  <div v-else-if="!bootstrapped" style="height:100vh; display:flex; align-items:center; justify-content:center; color:oklch(0.4 0.012 255); font-size:14px;">
    Loading forecast data…
  </div>

  <div v-else style="display:flex; flex-direction:column; height:100vh; overflow:hidden;">
    <AppHeader
      :t="t"
      :lang="lang"
      :query="query"
      :mobile="mobile"
      :nav-open="navOpen"
      :header-bg="c.headerBg"
      @toggle-nav="toggleNav"
      @update:query="query = $event"
      @set-lang="setLang"
    />

    <div style="flex:1; display:flex; min-height:0; position:relative;">
      <RegionTree
        :tree="tree"
        :t="t"
        :mobile="mobile"
        :nav-open="navOpen"
        :query="query"
        :primary="c.primary"
        :soft="c.soft"
        @toggle-region="toggleRegion"
        @select-location="selectLocation"
        @update:query="query = $event"
        @close-nav="closeNav"
      />

      <main style="flex:1; min-width:0; overflow-y:auto; background:oklch(0.975 0.004 250);">
        <div :style="{ padding: mobile ? '14px 14px 36px' : '18px 22px 40px', maxWidth: '1180px' }">
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
          <ObservationsTab v-if="tab === 'obs'" :obs-rows="obsRows" :obs-cards="obsCards" :mobile="mobile" :t="t" />
        </div>
      </main>
    </div>
  </div>
</template>

<style>
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; height: 100%; }
body { font-family: 'IBM Plex Sans', system-ui, sans-serif; background: oklch(0.975 0.004 250); color: oklch(0.24 0.012 255); -webkit-font-smoothing: antialiased; }
::-webkit-scrollbar { height: 10px; width: 10px; }
::-webkit-scrollbar-thumb { background: oklch(0.84 0.01 255); border-radius: 6px; }
::-webkit-scrollbar-track { background: transparent; }
</style>
