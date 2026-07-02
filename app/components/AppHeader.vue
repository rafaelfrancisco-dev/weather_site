<script setup lang="ts">
import type { Lang } from '~/utils/i18n'
import type { AccentTheme } from '~/utils/colors'
import type { Density } from '~/composables/useSettings'

const props = defineProps<{
  t: Record<string, string>
  lang: Lang
  query: string
  mobile: boolean
  navOpen: boolean
  headerBg: string
}>()

const emit = defineEmits<{
  toggleNav: []
  'update:query': [string]
  setLang: [Lang]
}>()

const settings = useSettings()
const settingsOpen = ref(false)

const accentOptions: AccentTheme[] = ['Institutional blue', 'Teal', 'Slate']
const densityOptions: Density[] = ['Comfortable', 'Compact']
</script>

<template>
  <header :style="{ flex: 'none', height: '54px', background: props.headerBg, color: '#fff', display: 'flex', alignItems: 'center', gap: '16px', padding: '0 16px', zIndex: 30, position: 'relative' }">
    <button
      aria-label="Menu"
      :aria-expanded="props.navOpen"
      :style="{ display: props.mobile ? 'inline-flex' : 'none', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', marginLeft: '-4px', flex: 'none', border: 'none', background: 'rgba(255,255,255,0.16)', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '17px', fontFamily: 'inherit' }"
      @click="emit('toggleNav')"
    >☰</button>

    <div style="display:flex; align-items:baseline; gap:9px;">
      <span style="font-weight:700; font-size:18px; letter-spacing:0.04em;">MET<span style="opacity:0.55;">·</span>PT</span>
      <span style="font-size:11px; opacity:0.7; font-weight:500; letter-spacing:0.02em;">{{ props.t.subtitle }}</span>
    </div>

    <div style="flex:1;"></div>

    <div :style="{ position: 'relative', display: props.mobile ? 'none' : 'flex', alignItems: 'center' }">
      <input
        :value="props.query"
        :placeholder="props.t.search"
        :aria-label="props.t.search"
        type="search"
        style="width:200px; height:30px; border:none; border-radius:5px; background:rgba(255,255,255,0.14); color:#fff; padding:0 10px 0 30px; font-size:12.5px; font-family:inherit; outline:none;"
        @input="emit('update:query', ($event.target as HTMLInputElement).value)"
      />
      <span style="position:absolute; left:9px; font-size:13px; opacity:0.7;">⌕</span>
    </div>

    <div style="display:flex; border:1px solid rgba(255,255,255,0.28); border-radius:5px; overflow:hidden;">
      <button
        :aria-pressed="props.lang === 'en'"
        aria-label="English"
        :style="{ border: 'none', cursor: 'pointer', padding: '5px 11px', fontSize: '11.5px', fontWeight: 600, fontFamily: 'inherit', background: props.lang === 'en' ? '#fff' : 'transparent', color: props.lang === 'en' ? props.headerBg : '#fff' }"
        @click="emit('setLang', 'en')"
      >EN</button>
      <button
        :aria-pressed="props.lang === 'pt'"
        aria-label="Português"
        :style="{ border: 'none', cursor: 'pointer', padding: '5px 11px', fontSize: '11.5px', fontWeight: 600, fontFamily: 'inherit', background: props.lang === 'pt' ? '#fff' : 'transparent', color: props.lang === 'pt' ? props.headerBg : '#fff' }"
        @click="emit('setLang', 'pt')"
      >PT</button>
    </div>

    <div style="position:relative;">
      <button
        aria-label="Settings"
        :aria-expanded="settingsOpen"
        style="display:flex; align-items:center; justify-content:center; width:30px; height:30px; border:none; background:rgba(255,255,255,0.14); border-radius:5px; color:#fff; cursor:pointer; font-size:14px;"
        @click="settingsOpen = !settingsOpen"
      >⚙</button>

      <div
        v-if="settingsOpen"
        style="position:absolute; right:0; top:38px; width:230px; background:#fff; color:oklch(0.24 0.012 255); border-radius:8px; box-shadow:0 8px 30px rgba(20,28,40,0.25); padding:14px; font-size:12.5px; z-index:50;"
      >
        <div style="font-weight:600; margin-bottom:8px;">{{ props.lang === 'pt' ? 'Aparência' : 'Appearance' }}</div>

        <div style="margin-bottom:10px;">
          <div style="color:var(--text-muted); margin-bottom:4px; font-size:11px;">{{ props.lang === 'pt' ? 'Cor de destaque' : 'Accent' }}</div>
          <div style="display:flex; gap:6px;">
            <button
              v-for="opt in accentOptions"
              :key="opt"
              :style="{ flex: 1, border: settings.accent === opt ? '2px solid oklch(0.5 0.12 255)' : '1px solid oklch(0.85 0.01 255)', borderRadius: '5px', padding: '4px', cursor: 'pointer', background: '#fff', fontSize: '10px' }"
              @click="settings.accent = opt"
            >{{ opt.split(' ')[0] }}</button>
          </div>
        </div>

        <div style="margin-bottom:10px;">
          <div style="color:var(--text-muted); margin-bottom:4px; font-size:11px;">{{ props.lang === 'pt' ? 'Densidade' : 'Density' }}</div>
          <div style="display:flex; gap:6px;">
            <button
              v-for="opt in densityOptions"
              :key="opt"
              :style="{ flex: 1, border: settings.density === opt ? '2px solid oklch(0.5 0.12 255)' : '1px solid oklch(0.85 0.01 255)', borderRadius: '5px', padding: '4px', cursor: 'pointer', background: '#fff', fontSize: '10px' }"
              @click="settings.density = opt"
            >{{ opt }}</button>
          </div>
        </div>

        <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
          <input type="checkbox" :checked="settings.hourlyBars" @change="settings.hourlyBars = ($event.target as HTMLInputElement).checked" />
          {{ props.lang === 'pt' ? 'Barras de precipitação' : 'Hourly precip bars' }}
        </label>
      </div>
    </div>
  </header>
</template>
