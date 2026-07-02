<script setup lang="ts">
import { strings } from '~/utils/i18n'
import { accentColors } from '~/utils/colors'
import { buildLocationTree } from '~/utils/transform'
import { parseLocationId } from '#shared/slug'

const route = useRoute()
const { query } = useNavigation()
const open = ref<Record<string, boolean>>({})

const { mobile } = useViewport()
const settings = useSettings()
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

function toggleRegion(id: string) {
  const group = tree.value.find(g => g.id === id)
  const currentlyOpen = group ? group.open : false
  open.value = { ...open.value, [id]: !currentlyOpen }
}

useHead({
  htmlAttrs: { lang: computed(() => settings.value.lang) }
})
</script>

<template>
  <div v-if="bootstrapError" style="height:100vh; display:flex; align-items:center; justify-content:center; color:oklch(0.55 0.21 27); font-size:14px;">
    {{ bootstrapError }}
  </div>
  <div v-else-if="!bootstrapped" style="height:100vh; display:flex; align-items:center; justify-content:center; color:oklch(0.4 0.012 255); font-size:14px;">
    Loading forecast data…
  </div>

  <div v-else style="display:flex; flex-direction:column; height:100vh; overflow:hidden;">
    <AppHeader
      :t="t"
      :mobile="mobile"
      :header-bg="c.headerBg"
    />

    <div style="flex:1; display:flex; min-height:0; position:relative;">
      <RegionTree
        :tree="tree"
        :t="t"
        :mobile="mobile"
        :primary="c.primary"
        :soft="c.soft"
        @toggle-region="toggleRegion"
      />

      <main style="flex:1; min-width:0; overflow-y:auto; background:var(--bg-page);">
        <div :style="{ padding: mobile ? '14px 14px 36px' : '18px 22px 40px' }">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
