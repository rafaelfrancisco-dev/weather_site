import type { AccentTheme } from '~/utils/colors'
import type { Lang } from '~/utils/i18n'

export type Density = 'Comfortable' | 'Compact'

export interface Settings {
  accent: AccentTheme
  density: Density
  hourlyBars: boolean
  lang: Lang
}

const STORAGE_KEY = 'metpt-settings'

const state = ref<Settings>({ accent: 'Institutional blue', density: 'Comfortable', hourlyBars: false, lang: 'en' })
let loaded = false

function load() {
  if (loaded || !import.meta.client) return
  loaded = true
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      Object.assign(state.value, JSON.parse(raw))
    } catch {
      // ignore malformed stored settings
    }
  }
  watch(state, () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state.value)), { deep: true })
}

export function useSettings() {
  load()
  return state
}

export function densityStyles(density: Density) {
  return density === 'Compact'
    ? { pad: '4px 8px', cellPad: '4px 2px', fz: '12px' }
    : { pad: '7px 12px', cellPad: '7px 3px', fz: '13px' }
}
