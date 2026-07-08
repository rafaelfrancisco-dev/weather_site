const DIACRITICS = new RegExp('[' + String.fromCharCode(0x0300) + '-' + String.fromCharCode(0x036f) + ']', 'g')
type DistrictGroup = 'mainland' | 'madeira' | 'azores'

export interface DistrictRouteMeta {
  name: string
  group: DistrictGroup
}

const DISTRICT_ROUTE_META: DistrictRouteMeta[] = [
  { name: 'Viana do Castelo', group: 'mainland' },
  { name: 'Braga', group: 'mainland' },
  { name: 'Vila Real', group: 'mainland' },
  { name: 'Bragança', group: 'mainland' },
  { name: 'Porto', group: 'mainland' },
  { name: 'Aveiro', group: 'mainland' },
  { name: 'Viseu', group: 'mainland' },
  { name: 'Guarda', group: 'mainland' },
  { name: 'Coimbra', group: 'mainland' },
  { name: 'Castelo Branco', group: 'mainland' },
  { name: 'Leiria', group: 'mainland' },
  { name: 'Santarém', group: 'mainland' },
  { name: 'Portalegre', group: 'mainland' },
  { name: 'Lisboa', group: 'mainland' },
  { name: 'Setúbal', group: 'mainland' },
  { name: 'Évora', group: 'mainland' },
  { name: 'Beja', group: 'mainland' },
  { name: 'Faro', group: 'mainland' },
  { name: 'Madeira', group: 'madeira' },
  { name: 'Açores', group: 'azores' },
]

export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function locationHref(id: number, name: string): string {
  return `/location/${id}-${slugify(name)}`
}

export function canonicalDistrictName(name: string): string {
  return name === 'Azores' ? 'Açores' : name
}

export function districtHref(name: string): string {
  return `/maps/${slugify(canonicalDistrictName(name))}`
}

export function districtSlugMatches(name: string, slug: string): boolean {
  if (slugify(canonicalDistrictName(name)) === slug) return true
  return canonicalDistrictName(name) === 'Açores' && slug === slugify('Azores')
}

export function districtRouteMetaForSlug(slug: string): DistrictRouteMeta | null {
  return DISTRICT_ROUTE_META.find(district => districtSlugMatches(district.name, slug)) ?? null
}

export function parseLocationId(param: string): number | null {
  const match = param.match(/^(\d+)/)
  if (!match) return null
  const id = Number(match[1])
  return Number.isFinite(id) ? id : null
}

export const LAST_LOCATION_COOKIE = 'metpt-last-location'
export const DEFAULT_LOCATION_PATH = '/location/1110600-lisboa'

// The cookie value is client-supplied and interpolated into a `Location`
// header by server/routes/index.get.ts — keep this allowlist strict, never
// loosen it to accept arbitrary strings.
const LOCATION_SLUG_RE = /^\d{1,10}(-[a-z0-9-]{1,80})?$/

export function isValidLocationSlug(raw: string): boolean {
  return LOCATION_SLUG_RE.test(raw)
}
