<script setup lang="ts">
import { strings } from '~/utils/i18n'
import { accentColors } from '~/utils/colors'
import { buildLocationTree } from '~/utils/transform'
import { parseLocationId } from '~/utils/slug'

const route = useRoute()
const query = ref('')
const navOpen = ref(false)
const open = ref<Record<string, boolean>>({})

const { mobile } = useViewport()
const settings = useSettings()
const {
  ready,
  clientError
} = useIpmaClient()
const {
  locations,
  districtMap,
  warningsByArea,
  bootstrapped,
  bootstrapError
} = useLocationsData()

const t = computed(() => strings(settings.value.lang))
const c = computed(() => accentColors(settings.value.accent))

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
  settings.value.lang
))

function toggleNav() {
  navOpen.value = !navOpen.value
}
function closeNav() {
  navOpen.value = false
}
function toggleRegion(id: string) {
  const currentlyOpen = open.value[id] !== false
  open.value = { ...open.value, [id]: !currentlyOpen }
}
function setLang(l: 'en' | 'pt') {
  settings.value.lang = l
}

useHead({
  htmlAttrs: { lang: computed(() => settings.value.lang) }
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
      :lang="settings.lang"
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
        @update:query="query = $event"
        @close-nav="closeNav"
      />

      <main style="flex:1; min-width:0; overflow-y:auto; background:oklch(0.975 0.004 250);">
        <div :style="{ padding: mobile ? '14px 14px 36px' : '18px 22px 40px', maxWidth: '1180px' }">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
