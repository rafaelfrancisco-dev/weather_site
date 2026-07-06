import type { AccentTheme } from '~/utils/colors'
import type { Lang } from '~/utils/i18n'

export type Density = 'Comfortable' | 'Compact'

export interface Settings {
  accent: AccentTheme
  density: Density
  hourlyBars: boolean
  lang: Lang
  lastLocationId: number | null
}

const STORAGE_KEY = 'metpt-settings'

const DEFAULTS: Settings = {
  accent: 'Institutional blue',
  density: 'Comfortable',
  hourlyBars: false,
  lang: 'en',
  lastLocationId: null
}

// /location/** pages are ISR-cached and shared across users, so SSR output
// must never depend on per-user settings — and Vue does not patch mismatched
// attribute/:style bindings during hydration, so the client has to render
// the same DEFAULTS while hydrating too. (Reading localStorage eagerly here
// used to hydrate returning users against mismatched HTML: "Hydration
// completed but contains mismatches" in prod, and a language toggle that
// looked stuck because the stale server-rendered highlight was never
// patched.) State therefore starts at DEFAULTS everywhere and localStorage
// is merged in only after hydration, via onNuxtReady — the same
// frozen-then-bump pattern as useNow.ts.
const state = ref<Settings>({ ...DEFAULTS })
let storageWired = false

function browserLang(): Lang {
  const candidates = navigator.languages?.length ? navigator.languages : [navigator.language]
  return candidates.some(l => l?.toLowerCase().startsWith('pt')) ? 'pt' : 'en'
}

function loadAndPersist() {
  let stored: Partial<Settings> | null = null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) stored = JSON.parse(raw)
  } catch { /* corrupt storage: fall through to defaults */ }

  // Wired before the merge below so the merged result is persisted too.
  watch(state, (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    } catch { /* quota exceeded / private mode: settings just don't persist */ }
  }, { deep: true })

  if (stored && typeof stored === 'object') {
    // Only merge stored values into keys still at their default: anything
    // already changed this session (e.g. the current page wrote
    // lastLocationId during hydration, before this ran) wins over a stale
    // stored value.
    const patch: Record<string, unknown> = {}
    for (const key of Object.keys(DEFAULTS) as (keyof Settings)[]) {
      if (key in stored && state.value[key] === DEFAULTS[key]) {
        patch[key] = stored[key]
      }
    }
    Object.assign(state.value, patch)
  } else {
    // First visit: default to the browser's language.
    state.value.lang = browserLang()
  }

  // The deep watch above only fires on mutations after this point — persist
  // once now so storage reflects any session writes (e.g. lastLocationId
  // from the current page) even when the merge itself changed nothing.
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.value))
  } catch { /* quota exceeded / private mode */ }

  // Cross-tab sync. Same-value setItem calls don't re-fire this event in
  // the writing tab, so the write-back from the deep watch can't loop.
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY || event.newValue == null) return
    try {
      Object.assign(state.value, JSON.parse(event.newValue))
    } catch { /* ignore malformed cross-tab payloads */ }
  })
}

export function useSettings() {
  if (import.meta.client && !storageWired) {
    storageWired = true
    onNuxtReady(loadAndPersist)
  }
  return state
}

export function densityStyles(density: Density) {
  return density === 'Compact'
    ? { pad: '4px 8px', cellPad: '4px 2px', fz: '12px' }
    : { pad: '7px 12px', cellPad: '7px 3px', fz: '13px' }
}
