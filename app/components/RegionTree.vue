<script setup lang="ts">
import type { TreeGroup } from '~/utils/transform'
import { locationHref } from '#shared/slug'
import { usePrefetchForecast } from '~/composables/useLocationForecast'
import { MOBILE_MEDIA_QUERY } from '~/utils/breakpoint'

const props = defineProps<{
  tree: TreeGroup[]
  t: Record<string, string>
  primary: string
  soft: string
}>()

const emit = defineEmits<{
  toggleRegion: [string]
}>()

const { prefetch } = usePrefetchForecast()
const { query, navOpen, closeNav } = useNavigation()
const { mobile } = useViewport()
const navEl = ref<HTMLElement | null>(null)
const drawerInert = computed(() => {
  if (navOpen.value) return null
  if (mobile.value) return ''
  if (import.meta.client && window.matchMedia(MOBILE_MEDIA_QUERY).matches) return ''
  return null
})

watchEffect(() => {
  if (!import.meta.client || !navEl.value) return
  if (drawerInert.value != null) navEl.value.setAttribute('inert', '')
  else navEl.value.removeAttribute('inert')
})

function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && mobile.value && navOpen.value) closeNav()
}

watch(navOpen, (open) => {
  if (!import.meta.client || !open) return
  document.addEventListener('keydown', onDocumentKeydown)
  onWatcherCleanup(() => {
    document.removeEventListener('keydown', onDocumentKeydown)
  })
})
</script>

<template>
  <div
    class="nav-backdrop"
    :class="{ 'nav-backdrop--open': navOpen }"
    @click="closeNav"
  ></div>

  <nav
    ref="navEl"
    class="region-nav"
    :class="{ 'nav--open': navOpen }"
  >
    <div class="drawer-search">
      <input
        v-model="query"
        :placeholder="props.t.search"
        :aria-label="props.t.search"
        type="search"
        style="width:100%; height:40px; border:1px solid var(--border); border-radius:8px; background:oklch(0.98 0.003 255); padding:0 12px 0 34px; font-size:16px; font-family:inherit; outline:none; color:inherit; box-sizing:border-box;"
      />
      <span style="position:absolute; left:26px; top:calc(50% + 5px); transform:translateY(-50%); font-size:15px; color:var(--text-subtle);">⌕</span>
    </div>

    <div style="padding:12px 12px 2px;">
      <NuxtLink
        to="/maps"
        :style="{
          width: '100%', display: 'flex', alignItems: 'center', gap: '9px',
          border: `1px solid ${$route.path.startsWith('/maps') ? props.primary : 'var(--border)'}`,
          background: $route.path.startsWith('/maps') ? props.soft : 'transparent',
          cursor: 'pointer', padding: '11px 12px', borderRadius: '9px',
          fontSize: '13px', fontWeight: 600,
          color: $route.path.startsWith('/maps') ? props.primary : 'oklch(0.34 0.012 255)',
          textDecoration: 'none', boxSizing: 'border-box',
        }"
        @click="closeNav"
      >
        <span style="font-size:15px; flex:none; line-height:1;">▦</span>
        <span style="flex:1;">{{ props.t.maps ?? 'Weather maps' }}</span>
        <span style="font-size:11px; opacity:0.6;">›</span>
      </NuxtLink>
    </div>

    <div style="padding:13px 16px 9px; font-size:10.5px; font-weight:600; letter-spacing:0.09em; text-transform:uppercase; color:var(--text-subtle);">{{ props.t.regions }}</div>

    <div v-for="region in props.tree" :key="region.id">
      <button
        class="region-toggle"
        :aria-expanded="region.open"
        style="width:100%; display:flex; align-items:center; gap:7px; border:none; background:none; cursor:pointer; font-family:inherit; font-size:13px; font-weight:600; color:var(--text-heading); text-align:left;"
        @click="emit('toggleRegion', region.id)"
      >
        <span :style="{ display: 'inline-block', width: '9px', fontSize: '10px', color: 'oklch(0.6 0.01 255)', transform: `rotate(${region.caret}deg)`, transition: 'transform 0.15s' }">▶</span>
        <span style="flex:1;">{{ region.name }}</span>
        <span
          v-if="region.warnCount"
          :style="{ fontSize: '9.5px', fontWeight: 700, color: '#fff', background: region.warnColor, borderRadius: '9px', minWidth: '16px', height: '16px', padding: '0 4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }"
        >{{ region.warnCount }}</span>
      </button>

      <div v-if="region.open" style="padding-bottom:4px;">
        <NuxtLink
          v-for="loc in region.locs"
          :key="loc.id"
          :to="locationHref(loc.id, loc.name)"
          class="loc-link"
          :class="{ 'loc-link--selected': loc.selected }"
          :style="{
            '--loc-accent': props.primary,
            '--loc-soft': props.soft,
            fontWeight: loc.selected ? 600 : 450
          }"
          @click="closeNav"
          @mouseenter="prefetch(loc.id)"
        >
          <span style="flex:1;">{{ loc.name }}</span>
          <span v-if="loc.warn" :style="{ width: '8px', height: '8px', borderRadius: '50%', background: loc.warnColor, flex: 'none' }"></span>
        </NuxtLink>
      </div>
    </div>

    <div style="padding:14px 16px; margin-top:6px; border-top:1px solid oklch(0.93 0.006 255); font-size:10.5px; line-height:1.6; color:oklch(0.6 0.01 255);">{{ props.t.disclaimer }}</div>
  </nav>
</template>

<style scoped>
.nav-backdrop {
  display: none;
}

.region-nav {
  position: relative;
  z-index: 40;
  flex: none;
  width: 248px;
  overflow-y: auto;
  border-right: 1px solid oklch(0.91 0.006 255);
  background: #fff;
}

.drawer-search {
  display: none;
}

.region-toggle {
  padding: 9px 16px;
}

.loc-link {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  border-left: 3px solid transparent;
  background: transparent;
  cursor: pointer;
  font-family: inherit;
  font-size: 12.5px;
  color: oklch(0.38 0.012 255);
  text-align: left;
  text-decoration: none;
  box-sizing: border-box;
  padding: 7px 16px 7px 28px;
  transition: background 0.12s ease;
}
.loc-link--selected {
  border-left-color: var(--loc-accent);
  background: var(--loc-soft);
  color: var(--loc-accent);
}
.loc-link:hover:not(.loc-link--selected),
.loc-link:active:not(.loc-link--selected) {
  background: oklch(0.965 0.005 255);
}

@media (max-width: 700px), ((pointer: coarse) and (max-width: 1024px)) {
  .nav-backdrop {
    position: fixed;
    z-index: 35;
    inset: 54px 0 0;
    background: rgba(20, 28, 40, 0.4);
  }

  .nav-backdrop--open {
    display: block;
  }

  .region-nav {
    position: fixed;
    top: 54px;
    bottom: 0;
    left: 0;
    width: min(82vw, 300px);
    visibility: hidden;
    border-right: none;
    box-shadow: 0 0 40px rgba(20, 28, 40, 0.25);
    transform: translateX(-100%);
    transition: transform 0.24s ease, visibility 0.24s ease;
  }

  .region-nav.nav--open {
    visibility: visible;
    transform: translateX(0);
  }

  .drawer-search {
    position: relative;
    display: block;
    padding: 12px 14px 2px;
  }

  .region-toggle {
    padding: 13px 16px;
  }

  .loc-link {
    padding: 12px 16px 12px 28px;
  }
}
</style>
