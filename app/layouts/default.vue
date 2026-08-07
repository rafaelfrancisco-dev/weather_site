<script setup lang="ts">
import { strings } from '~/utils/i18n'
import { accentColors } from '~/utils/colors'
import { buildLocationTree } from '~/utils/transform'
import { parseLocationId } from '#shared/slug'

const route = useRoute()
const { query } = useNavigation()
const open = ref<Record<string, boolean>>({})

const settings = useSettings()
const now = useNow()
const {
  locations,
  districtMap,
  warningsByArea,
  bootstrapped,
  bootstrapError,
  refreshBootstrap
} = useLocationsData()

// The raw fetch error isn't user-facing (it may leak upstream/internal
// details); log it for diagnostics and show a friendly localized message +
// retry button instead.
watch(bootstrapError, (err) => {
  if (err) console.error('[bootstrap]', err)
})

const retrying = ref(false)
async function retryBootstrap() {
  retrying.value = true
  try {
    await refreshBootstrap()
  } finally {
    retrying.value = false
  }
}

const t = computed(() => strings(settings.value.lang))
const c = computed(() => accentColors(settings.value.accent))

// <main> is the scroll container, not the document (.app-shell is 100dvh with
// overflow:hidden), so Vue Router's scrollBehavior — which only ever touches
// window scroll — never resets anything: navigating between locations used to
// land you at the previous page's offset. Accepted limitation: back/forward
// won't restore the old offset either, because router savedPosition records
// window scroll, which is always 0 here.
const mainEl = ref<HTMLElement | null>(null)
watch(() => route.path, () => {
  if (mainEl.value) mainEl.value.scrollTop = 0
}, { flush: 'post' })

const selectedId = computed(() => {
  if (route.name !== 'location-slug') return null
  return parseLocationId(route.params.slug as string)
})

const tree = computed(() => buildLocationTree(
  locations.value,
  districtMap.value,
  warningsByArea.value,
  selectedId.value,
  open.value,
  query.value,
  settings.value.lang,
  now.value
))

function toggleRegion(id: string) {
  const group = tree.value.find(g => g.id === id)
  const currentlyOpen = group ? group.open : false
  open.value = { ...open.value, [id]: !currentlyOpen }
}

// nuxt-seo-utils also renders <html lang> (from site.defaultLocale) with
// tagPriority 'low'. In unhead's htmlAttrs merge, entries are processed in
// ascending weight order and the LAST processed wins each attribute —
// 'low' is weight 102 vs the default 100, so a default-priority entry here
// silently loses to the module's static 'en'. tagPriority 110 sorts this
// entry after it, and the function-form input keeps it reactive to the
// language toggle. SSR output is unchanged ('en' defaults either way).
useHead(() => ({
  htmlAttrs: { lang: settings.value.lang }
}), { tagPriority: 110 })
</script>

<template>
  <div v-if="bootstrapError && !bootstrapped" class="app-shell app-shell--center" style="flex-direction:column; gap:12px; color:oklch(0.55 0.21 27); font-size:14px;">
    <div>{{ t.bootstrapError }}</div>
    <button
      type="button"
      :disabled="retrying"
      style="font-family:inherit; font-size:13px; font-weight:500; color:oklch(0.55 0.21 27); background:none; border:1px solid oklch(0.55 0.21 27); border-radius:6px; padding:7px 14px; cursor:pointer;"
      @click="retryBootstrap"
    >{{ t.retry }}</button>
  </div>
  <div v-else-if="!bootstrapped" class="app-shell app-shell--center" style="color:oklch(0.4 0.012 255); font-size:14px;">
    Loading forecast data…
  </div>

  <div v-else class="app-shell" style="display:flex; flex-direction:column; overflow:hidden;">
    <AppHeader
      :t="t"
      :header-bg="c.headerBg"
    />

    <div style="flex:1; display:flex; min-height:0; position:relative;">
      <RegionTree
        :tree="tree"
        :t="t"
        :primary="c.primary"
        :soft="c.soft"
        @toggle-region="toggleRegion"
      />

      <main ref="mainEl" style="flex:1; min-width:0; overflow-y:auto; background:var(--bg-page);">
        <div class="app-content">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  height: 100vh;
  height: 100dvh;
}

.app-shell--center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-content {
  padding: 18px 22px 40px;
}

@media (max-width: 700px), ((pointer: coarse) and (max-width: 1024px)) {
  .app-content {
    padding: 14px 14px 36px;
  }
}
</style>
