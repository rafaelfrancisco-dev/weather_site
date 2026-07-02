<script setup lang="ts">
import type { AccentTheme } from '~/utils/colors'
import type { Density } from '~/composables/useSettings'

const props = defineProps<{
  t: Record<string, string>
  headerBg: string
}>()

const settings = useSettings()
const settingsOpen = ref(false)
const settingsRoot = ref<HTMLElement | null>(null)
const { query, navOpen, toggleNav } = useNavigation()

const accentOptions: AccentTheme[] = ['Institutional blue', 'Teal', 'Slate']
const densityOptions: Density[] = ['Comfortable', 'Compact']

useHead({
  meta: [
    { name: 'theme-color', content: computed(() => props.headerBg) }
  ]
})

function closeSettings() {
  settingsOpen.value = false
}

function onDocumentPointerdown(event: PointerEvent) {
  if (!settingsRoot.value?.contains(event.target as Node)) closeSettings()
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeSettings()
}

watch(settingsOpen, (open) => {
  if (!import.meta.client || !open) return
  document.addEventListener('pointerdown', onDocumentPointerdown)
  document.addEventListener('keydown', onDocumentKeydown)
  onWatcherCleanup(() => {
    document.removeEventListener('pointerdown', onDocumentPointerdown)
    document.removeEventListener('keydown', onDocumentKeydown)
  })
})
</script>

<template>
  <header class="app-header" :style="{ background: props.headerBg }">
    <button
      class="menu-button"
      aria-label="Menu"
      :aria-expanded="navOpen"
      @click="toggleNav"
    >☰</button>

    <div class="brand-block">
      <span class="brand-title">MET<span style="opacity:0.55;">·</span>PT</span>
      <span class="brand-subtitle">{{ props.t.subtitle }}</span>
    </div>

    <div style="flex:1;"></div>

    <div class="header-search">
      <input
        v-model="query"
        :placeholder="props.t.search"
        :aria-label="props.t.search"
        type="search"
        style="width:200px; height:30px; border:none; border-radius:5px; background:rgba(255,255,255,0.14); color:#fff; padding:0 10px 0 30px; font-size:12.5px; font-family:inherit; outline:none;"
      />
      <span style="position:absolute; left:9px; font-size:13px; opacity:0.7;">⌕</span>
    </div>

    <div class="lang-toggle">
      <button
        class="lang-button"
        :aria-pressed="settings.lang === 'en'"
        aria-label="English"
        :style="{ border: 'none', cursor: 'pointer', padding: '5px 11px', fontSize: '11.5px', fontWeight: 600, fontFamily: 'inherit', background: settings.lang === 'en' ? '#fff' : 'transparent', color: settings.lang === 'en' ? props.headerBg : '#fff' }"
        @click="settings.lang = 'en'"
      >EN</button>
      <button
        class="lang-button"
        :aria-pressed="settings.lang === 'pt'"
        aria-label="Português"
        :style="{ border: 'none', cursor: 'pointer', padding: '5px 11px', fontSize: '11.5px', fontWeight: 600, fontFamily: 'inherit', background: settings.lang === 'pt' ? '#fff' : 'transparent', color: settings.lang === 'pt' ? props.headerBg : '#fff' }"
        @click="settings.lang = 'pt'"
      >PT</button>
    </div>

    <div ref="settingsRoot" class="settings-root">
      <button
        class="settings-button"
        aria-label="Settings"
        :aria-expanded="settingsOpen"
        @click="settingsOpen = !settingsOpen"
      >⚙</button>

      <div
        v-if="settingsOpen"
        class="settings-popover"
      >
        <div style="font-weight:600; margin-bottom:8px;">{{ settings.lang === 'pt' ? 'Aparência' : 'Appearance' }}</div>

        <div style="margin-bottom:10px;">
          <div style="color:var(--text-muted); margin-bottom:4px; font-size:11px;">{{ settings.lang === 'pt' ? 'Cor de destaque' : 'Accent' }}</div>
          <div style="display:flex; gap:6px;">
            <button
              v-for="opt in accentOptions"
              :key="opt"
              class="settings-option"
              :style="{ flex: 1, border: settings.accent === opt ? '2px solid oklch(0.5 0.12 255)' : '1px solid oklch(0.85 0.01 255)', borderRadius: '5px', padding: '4px', cursor: 'pointer', background: '#fff', fontSize: '10px' }"
              @click="settings.accent = opt"
            >{{ opt.split(' ')[0] }}</button>
          </div>
        </div>

        <div style="margin-bottom:10px;">
          <div style="color:var(--text-muted); margin-bottom:4px; font-size:11px;">{{ settings.lang === 'pt' ? 'Densidade' : 'Density' }}</div>
          <div style="display:flex; gap:6px;">
            <button
              v-for="opt in densityOptions"
              :key="opt"
              class="settings-option"
              :style="{ flex: 1, border: settings.density === opt ? '2px solid oklch(0.5 0.12 255)' : '1px solid oklch(0.85 0.01 255)', borderRadius: '5px', padding: '4px', cursor: 'pointer', background: '#fff', fontSize: '10px' }"
              @click="settings.density = opt"
            >{{ opt }}</button>
          </div>
        </div>

        <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
          <input type="checkbox" :checked="settings.hourlyBars" @change="settings.hourlyBars = ($event.target as HTMLInputElement).checked" />
          {{ settings.lang === 'pt' ? 'Barras de precipitação' : 'Hourly precip bars' }}
        </label>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: relative;
  z-index: 30;
  display: flex;
  flex: none;
  align-items: center;
  gap: 16px;
  height: 54px;
  padding: 0 16px;
  color: #fff;
}

.menu-button {
  display: none;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  margin-left: -4px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
  cursor: pointer;
  font-family: inherit;
  font-size: 17px;
}

.brand-block {
  display: flex;
  min-width: 0;
  align-items: baseline;
  gap: 9px;
  white-space: nowrap;
}

.brand-title {
  flex: none;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.brand-subtitle {
  min-width: 0;
  overflow: hidden;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.02em;
  opacity: 0.7;
  text-overflow: ellipsis;
}

.header-search {
  position: relative;
  display: flex;
  align-items: center;
}

.header-search input {
  font-size: 16px !important;
}

.lang-toggle {
  display: flex;
  flex: none;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 5px;
}

.settings-root {
  position: relative;
  flex: none;
}

.settings-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  cursor: pointer;
  font-size: 14px;
}

.settings-popover {
  position: absolute;
  z-index: 50;
  top: 38px;
  right: 0;
  width: 230px;
  padding: 14px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 8px 30px rgba(20, 28, 40, 0.25);
  color: oklch(0.24 0.012 255);
  font-size: 12.5px;
}

@media (max-width: 700px), ((pointer: coarse) and (max-width: 1024px)) {
  .app-header {
    gap: 10px;
    padding: 0 12px;
  }

  .menu-button {
    display: inline-flex;
  }

  .brand-block {
    gap: 7px;
  }

  .header-search {
    display: none;
  }

  .lang-button,
  .settings-option {
    min-height: 40px;
  }

  .lang-button {
    min-width: 40px;
    padding-inline: 10px !important;
  }

  .settings-button {
    width: 40px;
    height: 40px;
  }

  .settings-popover {
    top: 46px;
    right: 0;
  }
}

@media (max-width: 480px) {
  .brand-subtitle {
    display: none;
  }
}
</style>
