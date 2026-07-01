const DIACRITICS = new RegExp('[' + String.fromCharCode(0x0300) + '-' + String.fromCharCode(0x036f) + ']', 'g')

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

export function parseLocationId(param: string): number | null {
  const match = param.match(/^(\d+)/)
  if (!match) return null
  const id = Number(match[1])
  return Number.isFinite(id) ? id : null
}
