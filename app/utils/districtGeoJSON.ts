import { PT_GEO } from './portugal-geo-data'

let cached: GeoJSON.FeatureCollection | null = null

function parseSvgPath(d: string): number[][][] {
  const rings: number[][][] = []
  let current: number[][] = []

  const re = /([MLZmlz])|(-?\d+\.?\d*)/g
  const tokens: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(d)) !== null) tokens.push(m[0])

  let i = 0
  while (i < tokens.length) {
    const t = tokens[i]
    if (t === 'M' || t === 'm') {
      if (current.length >= 3) rings.push(current)
      current = []
      const x = parseFloat(tokens[i + 1])
      const y = parseFloat(tokens[i + 2])
      current.push([x, y])
      i += 3
    } else if (t === 'L' || t === 'l') {
      const x = parseFloat(tokens[i + 1])
      const y = parseFloat(tokens[i + 2])
      current.push([x, y])
      i += 3
    } else if (t === 'Z' || t === 'z') {
      if (current.length >= 3) {
        const [fx, fy] = current[0]
        const [lx, ly] = current[current.length - 1]
        if (fx !== lx || fy !== ly) current.push([fx, fy])
        rings.push(current)
      }
      current = []
      i++
    } else {
      i++
    }
  }
  if (current.length >= 3) rings.push(current)
  return rings
}

function svgToWgs84(group: string, x: number, y: number): [number, number] {
  const p = PT_GEO.groups[group]?.proj
  if (!p) return [0, 0]
  return [
    (x - p.ox) / (p.cosL * p.s) + p.lonMin,
    p.latMax - (y - p.oy) / p.s,
  ]
}

// PT_GEO uses 'Azores' but the rest of the app uses 'Açores'
const NAME_MAP: Record<string, string> = { Azores: 'Açores' }

export function buildDistrictGeoJSON(): GeoJSON.FeatureCollection {
  if (cached) return cached

  const features: GeoJSON.Feature[] = PT_GEO.districts.map(district => {
    const rings = parseSvgPath(district.d)
    const wgsRings = rings.map(ring => ring.map(([x, y]) => svgToWgs84(district.group, x, y)))
    const name = NAME_MAP[district.name] ?? district.name

    if (wgsRings.length === 1) {
      return {
        type: 'Feature' as const,
        properties: { name, group: district.group },
        geometry: { type: 'Polygon' as const, coordinates: wgsRings },
      }
    }
    return {
      type: 'Feature' as const,
      properties: { name, group: district.group },
      geometry: { type: 'MultiPolygon' as const, coordinates: wgsRings.map(r => [r]) },
    }
  })

  cached = { type: 'FeatureCollection', features }
  return cached
}
