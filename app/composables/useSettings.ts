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

const state = useLocalStorage<Settings>(
  STORAGE_KEY,
  { accent: 'Institutional blue', density: 'Comfortable', hourlyBars: false, lang: 'en', lastLocationId: null },
  { mergeDefaults: true }
)

export function useSettings() {
  return state
}

export function densityStyles(density: Density) {
  return density === 'Compact'
    ? { pad: '4px 8px', cellPad: '4px 2px', fz: '12px' }
    : { pad: '7px 12px', cellPad: '7px 3px', fz: '13px' }
}
