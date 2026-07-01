import type {
  JSDistrict,
  JSLocation,
  JSLookupDescription,
  JSWeatherWarning,
} from '#shared/ipma-types'
import { levelColor, levelLabelTxt, levelRank, levelSoft } from '~/utils/colors'
import type { WarningLevel } from '~/utils/colors'
import { dateTimeLabel } from '~/utils/format'
import type { Lang } from '~/utils/i18n'

const REGION_LABELS: Record<number, { en: string, pt: string }> = {
  1: { en: 'Mainland', pt: 'Continente' },
  2: { en: 'Madeira', pt: 'Madeira' },
  3: { en: 'Azores', pt: 'Açores' },
}

export function regionLabel(regionID: number, lang: Lang): string {
  const entry = REGION_LABELS[regionID]
  return entry ? entry[lang] : `Region ${regionID}`
}

export function isWarningActive(w: JSWeatherWarning, now = new Date()): boolean {
  const start = new Date(w.startTime).getTime()
  const end = new Date(w.endTime).getTime()
  return now.getTime() >= start && now.getTime() <= end
}

export function normalizeLevel(w: JSWeatherWarning): WarningLevel {
  const raw = (w.awarenessLevelID || w.level || 'green').toLowerCase()
  if (raw === 'yellow' || raw === 'orange' || raw === 'red' || raw === 'green') return raw
  return 'green'
}

export function createLabelLookup(descriptions: JSLookupDescription[]) {
  const map = new Map(descriptions.map(d => [d.id, d]))
  return (id: number, lang: Lang): string => {
    const entry = map.get(id)
    if (!entry) return `Type ${id}`
    return lang === 'pt' ? entry.descriptionPT : entry.descriptionEN
  }
}

export interface TreeLocation {
  id: number
  name: string
  selected: boolean
  warn: boolean
  warnColor: string
}

export interface TreeGroup {
  id: string
  name: string
  open: boolean
  caret: number
  locs: TreeLocation[]
  warnCount: number
  warnColor: string
}

function groupKeyFor(loc: JSLocation, districtMap: Map<number, JSDistrict>, lang: Lang): { key: string, name: string, tier: number } {
  if (loc.regionID === 1) {
    const district = districtMap.get(loc.districtID)
    return { key: `d-${loc.districtID}`, name: district?.name ?? `District ${loc.districtID}`, tier: 0 }
  }
  return { key: `r-${loc.regionID}`, name: regionLabel(loc.regionID, lang), tier: loc.regionID }
}

export function buildLocationTree(
  locations: JSLocation[],
  districtMap: Map<number, JSDistrict>,
  warningsByArea: Map<string, JSWeatherWarning[]>,
  selectedId: number | null,
  openMap: Record<string, boolean>,
  query: string,
  lang: Lang,
): TreeGroup[] {
  const q = query.trim().toLowerCase()
  const groups = new Map<string, { name: string, tier: number, locs: JSLocation[] }>()
  for (const loc of locations) {
    if (q && !loc.name.toLowerCase().includes(q)) continue
    const { key, name, tier } = groupKeyFor(loc, districtMap, lang)
    if (!groups.has(key)) groups.set(key, { name, tier, locs: [] })
    groups.get(key)!.locs.push(loc)
  }

  const keys = [...groups.keys()].sort((a, b) => {
    const ga = groups.get(a)!
    const gb = groups.get(b)!
    if (ga.tier !== gb.tier) return ga.tier - gb.tier
    return ga.name.localeCompare(gb.name)
  })

  return keys.map((key) => {
    const group = groups.get(key)!
    const locs = group.locs.slice().sort((a, b) => a.name.localeCompare(b.name))
    let warnMax = 0
    let warnMaxLevel: WarningLevel = 'green'
    let warnCount = 0

    const treeLocs: TreeLocation[] = locs.map((loc) => {
      const warnings = (warningsByArea.get(loc.warningAreaID) || []).filter(w => isWarningActive(w))
      let lvl: WarningLevel = 'green'
      let rank = 0
      for (const w of warnings) {
        const level = normalizeLevel(w)
        if (level === 'green') continue
        if (levelRank(level) > rank) {
          rank = levelRank(level)
          lvl = level
        }
      }
      if (rank > 0) warnCount++
      if (rank > warnMax) {
        warnMax = rank
        warnMaxLevel = lvl
      }
      return {
        id: loc.id,
        name: loc.name,
        selected: loc.id === selectedId,
        warn: rank > 0,
        warnColor: rank > 0 ? levelColor(lvl) : 'transparent',
      }
    })

    const containsSelected = selectedId !== null && treeLocs.some(l => l.id === selectedId)
    const isOpen = openMap[key] !== undefined ? openMap[key] : containsSelected

    return {
      id: key,
      name: group.name,
      open: isOpen,
      caret: isOpen ? 90 : 0,
      locs: treeLocs,
      warnCount,
      warnColor: warnCount > 0 ? levelColor(warnMaxLevel) : 'transparent',
    }
  })
}

export interface LocationMeta {
  name: string
  region: string
  district: string
  coord: string
  updated: string
}

export function buildLocationMeta(
  location: JSLocation,
  district: JSDistrict | undefined,
  dataUpdate: string | null,
  lang: Lang,
): LocationMeta {
  const lat = Math.abs(location.latitude).toFixed(2) + '°' + (location.latitude >= 0 ? 'N' : 'S')
  const lon = Math.abs(location.longitude).toFixed(2) + '°' + (location.longitude >= 0 ? 'E' : 'W')
  const updated = dataUpdate ? dateTimeLabel(new Date(dataUpdate), lang) : '—'
  return {
    name: location.name,
    region: regionLabel(location.regionID, lang),
    district: district?.name ?? '—',
    coord: `${lat} ${lon}`,
    updated,
  }
}

export interface WarningBanner {
  hasWarn: boolean
  banner: {
    color: string
    soft: string
    level: string
    levelLabel: string
    type: string
    text: string
    window: string
  } | null
}

export function buildWarningBanner(warnings: JSWeatherWarning[], lang: Lang, warningsLabel: string): WarningBanner {
  const active = warnings.filter(w => isWarningActive(w) && normalizeLevel(w) !== 'green')
  if (active.length === 0) return { hasWarn: false, banner: null }

  let top = active[0]
  let topRank = levelRank(normalizeLevel(top))
  for (const w of active) {
    const rank = levelRank(normalizeLevel(w))
    if (rank > topRank) {
      topRank = rank
      top = w
    }
  }

  const level = normalizeLevel(top)
  const fmt = (iso: string) => dateTimeLabel(new Date(iso), lang)

  return {
    hasWarn: true,
    banner: {
      color: levelColor(level),
      soft: levelSoft(level),
      level: levelLabelTxt(level, lang),
      levelLabel: warningsLabel,
      type: top.awarenessTypeName,
      text: top.text,
      window: `${fmt(top.startTime)} – ${fmt(top.endTime)}`,
    },
  }
}
