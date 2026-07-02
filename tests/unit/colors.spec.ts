import { describe, expect, it } from 'vitest'
import {
  accentColors,
  fireColor,
  levelColor,
  levelLabelTxt,
  levelRank,
  levelSoft,
  tempFill,
  uvColor,
  waveFill,
} from '~/utils/colors'

describe('tempFill boundaries', () => {
  it('is stable just below and at each threshold', () => {
    expect(tempFill(6)).toBe('oklch(0.74 0.13 256)')
    expect(tempFill(7)).toBe('oklch(0.80 0.11 250)')
    expect(tempFill(10)).toBe('oklch(0.80 0.11 250)')
    expect(tempFill(11)).toBe('oklch(0.86 0.08 235)')
  })

  it('clamps to the hottest stop above the last threshold', () => {
    expect(tempFill(38)).toBe('oklch(0.65 0.19 35)')
    expect(tempFill(39)).toBe('oklch(0.55 0.21 27)')
    expect(tempFill(100)).toBe('oklch(0.55 0.21 27)')
  })
})

describe('uvColor boundaries', () => {
  it('switches bands at the documented cutoffs', () => {
    expect(uvColor(2.9)).toBe('oklch(0.62 0.13 150)')
    expect(uvColor(3)).toBe('oklch(0.78 0.14 90)')
    expect(uvColor(5.9)).toBe('oklch(0.78 0.14 90)')
    expect(uvColor(6)).toBe('oklch(0.70 0.16 58)')
    expect(uvColor(7.9)).toBe('oklch(0.70 0.16 58)')
    expect(uvColor(8)).toBe('oklch(0.55 0.21 27)')
    expect(uvColor(10.9)).toBe('oklch(0.55 0.21 27)')
    expect(uvColor(11)).toBe('oklch(0.45 0.2 320)')
  })
})

describe('fireColor lookups', () => {
  it('returns the stop for each in-range risk level', () => {
    expect(fireColor(1)).toBe('oklch(0.78 0.10 150)')
    expect(fireColor(5)).toBe('oklch(0.57 0.20 30)')
  })

  it('falls back to a neutral color when the level is past the end of the scale', () => {
    expect(fireColor(6)).toBe('oklch(0.9 0.01 255)')
  })
})

describe('waveFill boundaries', () => {
  it('switches bands at the documented cutoffs', () => {
    expect(waveFill(1.49)).toBe('oklch(0.88 0.05 220)')
    expect(waveFill(1.5)).toBe('oklch(0.78 0.09 235)')
    expect(waveFill(4.5)).toBe('oklch(0.45 0.16 270)')
  })
})

describe('warning level lookups', () => {
  it('ranks levels in ascending severity', () => {
    expect(levelRank('green')).toBeLessThan(levelRank('yellow'))
    expect(levelRank('yellow')).toBeLessThan(levelRank('orange'))
    expect(levelRank('orange')).toBeLessThan(levelRank('red'))
  })

  it('provides a color and soft color per level', () => {
    for (const level of ['green', 'yellow', 'orange', 'red'] as const) {
      expect(levelColor(level)).toMatch(/^oklch\(/)
      expect(levelSoft(level)).toMatch(/^oklch\(/)
    }
  })

  it('localizes level labels', () => {
    expect(levelLabelTxt('red', 'en')).toBe('Red')
    expect(levelLabelTxt('red', 'pt')).toBe('Vermelho')
  })
})

describe('accentColors themes', () => {
  it('returns a distinct palette for each of the three accent themes', () => {
    const blue = accentColors('Institutional blue')
    const teal = accentColors('Teal')
    const slate = accentColors('Slate')

    for (const palette of [blue, teal, slate]) {
      expect(palette).toHaveProperty('primary')
      expect(palette).toHaveProperty('soft')
      expect(palette).toHaveProperty('headerBg')
    }

    expect(blue.primary).not.toBe(teal.primary)
    expect(teal.primary).not.toBe(slate.primary)
    expect(blue.primary).not.toBe(slate.primary)
  })
})
