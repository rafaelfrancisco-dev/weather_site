<script setup lang="ts">
import type { TreeGroup } from '~/utils/transform'
import { locationHref } from '#shared/slug'
import { usePrefetchForecast } from '~/composables/useLocationForecast'

const props = defineProps<{
  tree: TreeGroup[]
  t: Record<string, string>
  mobile: boolean
  navOpen: boolean
  query: string
  primary: string
  soft: string
}>()

const emit = defineEmits<{
  toggleRegion: [string]
  'update:query': [string]
  closeNav: []
}>()

const { prefetch } = usePrefetchForecast()
</script>

<template>
  <div
    :style="{ display: props.mobile && props.navOpen ? 'block' : 'none', position: 'fixed', left: 0, right: 0, top: '54px', bottom: 0, background: 'rgba(20,28,40,0.4)', zIndex: 35 }"
    @click="emit('closeNav')"
  ></div>

  <nav
    :style="{
      flex: 'none',
      width: '248px',
      background: '#fff',
      borderRight: '1px solid oklch(0.91 0.006 255)',
      overflowY: 'auto',
      position: props.mobile ? 'fixed' : 'relative',
      left: props.mobile ? (props.navOpen ? '0px' : '-300px') : '0px',
      top: props.mobile ? '54px' : '0px',
      bottom: 0,
      zIndex: 40,
      boxShadow: (props.mobile && props.navOpen) ? '0 0 40px rgba(20,28,40,0.25)' : 'none',
      transition: 'left 0.24s ease'
    }"
  >
    <div :style="{ display: props.mobile ? 'block' : 'none', padding: '12px 14px 2px', position: 'relative' }">
      <input
        :value="props.query"
        :placeholder="props.t.search"
        style="width:100%; height:40px; border:1px solid oklch(0.88 0.008 255); border-radius:8px; background:oklch(0.98 0.003 255); padding:0 12px 0 34px; font-size:14px; font-family:inherit; outline:none; color:inherit; box-sizing:border-box;"
        @input="emit('update:query', ($event.target as HTMLInputElement).value)"
      />
      <span style="position:absolute; left:26px; top:calc(50% + 5px); transform:translateY(-50%); font-size:15px; color:oklch(0.55 0.01 255);">⌕</span>
    </div>

    <div style="padding:12px 12px 2px;">
      <NuxtLink
        to="/maps"
        :style="{
          width: '100%', display: 'flex', alignItems: 'center', gap: '9px',
          border: `1px solid ${$route.path.startsWith('/maps') ? props.primary : 'oklch(0.88 0.008 255)'}`,
          background: $route.path.startsWith('/maps') ? props.soft : 'transparent',
          cursor: 'pointer', padding: '11px 12px', borderRadius: '9px',
          fontSize: '13px', fontWeight: 600,
          color: $route.path.startsWith('/maps') ? props.primary : 'oklch(0.34 0.012 255)',
          textDecoration: 'none', boxSizing: 'border-box',
        }"
        @click="emit('closeNav')"
      >
        <span style="font-size:15px; flex:none; line-height:1;">▦</span>
        <span style="flex:1;">{{ props.t.maps ?? 'Weather maps' }}</span>
        <span style="font-size:11px; opacity:0.6;">›</span>
      </NuxtLink>
    </div>

    <div style="padding:13px 16px 9px; font-size:10.5px; font-weight:600; letter-spacing:0.09em; text-transform:uppercase; color:oklch(0.55 0.01 255);">{{ props.t.regions }}</div>

    <div v-for="region in props.tree" :key="region.id">
      <button
        :style="{ width: '100%', display: 'flex', alignItems: 'center', gap: '7px', border: 'none', background: 'none', cursor: 'pointer', padding: props.mobile ? '13px 16px' : '9px 16px', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600, color: 'oklch(0.30 0.012 255)', textAlign: 'left' }"
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
            padding: props.mobile ? '12px 16px 12px 28px' : '7px 16px 7px 28px',
            fontWeight: loc.selected ? 600 : 450
          }"
          @click="emit('closeNav')"
          @mouseenter="prefetch(loc.id)"
          @touchstart="prefetch(loc.id)"
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
</style>
