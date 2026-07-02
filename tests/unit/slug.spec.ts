import { describe, expect, it } from 'vitest'
import { districtSlugMatches, locationHref, parseLocationId, slugify } from '#shared/slug'

describe('slugify', () => {
  it('strips diacritics', () => {
    expect(slugify('Bragança')).toBe('braganca')
    expect(slugify('Évora')).toBe('evora')
    expect(slugify('Setúbal')).toBe('setubal')
  })

  it('lowercases and replaces punctuation/spaces with hyphens', () => {
    expect(slugify('Vila Nova de Gaia')).toBe('vila-nova-de-gaia')
    expect(slugify("Ponta Delgada (São Miguel)")).toBe('ponta-delgada-sao-miguel')
  })

  it('trims leading/trailing hyphens', () => {
    expect(slugify('  Faro  ')).toBe('faro')
    expect(slugify('--Porto--')).toBe('porto')
  })
})

describe('locationHref / parseLocationId round-trip', () => {
  it('parses the numeric id back out of a generated href', () => {
    const href = locationHref(1110600, 'Lisboa')
    expect(href).toBe('/location/1110600-lisboa')
    expect(parseLocationId(href.split('/').pop()!)).toBe(1110600)
  })

  it('ignores the cosmetic name suffix', () => {
    expect(parseLocationId('1010500-anything-goes-here')).toBe(1010500)
  })

  it('returns null when there is no leading numeric id', () => {
    expect(parseLocationId('not-a-number')).toBeNull()
  })
})

describe('districtSlugMatches — Açores/Azores special-case', () => {
  it('matches the canonical Açores slug', () => {
    expect(districtSlugMatches('Açores', 'acores')).toBe(true)
  })

  it('also matches the legacy "azores" slug', () => {
    expect(districtSlugMatches('Açores', 'azores')).toBe(true)
  })

  it('matches when the district name itself is spelled "Azores"', () => {
    expect(districtSlugMatches('Azores', 'acores')).toBe(true)
    expect(districtSlugMatches('Azores', 'azores')).toBe(true)
  })

  it('does not match an unrelated slug', () => {
    expect(districtSlugMatches('Açores', 'madeira')).toBe(false)
  })

  it('matches ordinary districts by their own slug', () => {
    expect(districtSlugMatches('Bragança', 'braganca')).toBe(true)
    expect(districtSlugMatches('Bragança', 'porto')).toBe(false)
  })
})
