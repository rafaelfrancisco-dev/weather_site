import { PT_GEO } from './portugal-geo-data'

// ---------- projection ----------

export function projPoint(group: string, lon: number, lat: number): { x: number; y: number } {
  const g = PT_GEO.groups[group]
  if (!g) return { x: 0, y: 0 }
  const p = g.proj
  return { x: p.ox + (lon - p.lonMin) * p.cosL * p.s, y: p.oy + (p.latMax - lat) * p.s }
}

// ---------- weather icon (SVG data-URI) ----------

export function iconSvg(wt: number, day: boolean): string {
  const S = (inner: string) =>
    'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'>${inner}</svg>`)
  const cloud = (f: string) =>
    `<ellipse cx='13' cy='19' rx='6.5' ry='5.5' fill='${f}'/><ellipse cx='20.5' cy='17.5' rx='7' ry='6' fill='${f}'/><rect x='7' y='18.5' width='19' height='7' rx='3.5' fill='${f}'/>`
  const rays = (cx: number, cy: number) => {
    let s = `<g stroke='#f3b13c' stroke-width='2' stroke-linecap='round'>`
    for (let a = 0; a < 360; a += 45) {
      const r1 = (a * Math.PI) / 180
      const ix = cx + Math.cos(r1) * 7.5, iy = cy + Math.sin(r1) * 7.5
      const ox = cx + Math.cos(r1) * 10.5, oy = cy + Math.sin(r1) * 10.5
      s += `<line x1='${ix.toFixed(1)}' y1='${iy.toFixed(1)}' x2='${ox.toFixed(1)}' y2='${oy.toFixed(1)}'/>`
    }
    return s + '</g>'
  }
  const sun = (cx: number, cy: number, r: number) => rays(cx, cy) + `<circle cx='${cx}' cy='${cy}' r='${r}' fill='#f3b13c'/>`
  const moon = (cx: number, cy: number) => `<path d='M${cx + 4} ${cy - 7}a8 8 0 1 0 1.5 15 6.4 6.4 0 0 1 -1.5-15z' fill='#e7cd6a'/>`
  const drops = (xs: number[], col: string) => {
    let s = `<g stroke='${col}' stroke-width='2' stroke-linecap='round'>`
    xs.forEach(x => { s += `<line x1='${x}' y1='26' x2='${x - 1.5}' y2='29.5'/>` })
    return s + '</g>'
  }
  switch (wt) {
    case 1: return S(day ? sun(16, 14, 6.5) : moon(15, 15))
    case 2: case 3: return S((day ? sun(11, 11, 4.5) : moon(11, 11)) + cloud('#aeb9c6'))
    case 4: return S(cloud('#94a2b4'))
    case 5: return S(cloud('#c3ccd7'))
    case 6: return S((day ? sun(10, 10, 3.8) : '') + cloud('#9aa7b8') + drops([12, 18, 22], '#3f86c9'))
    case 7: return S((day ? sun(10, 10, 3.8) : '') + cloud('#aeb9c6') + drops([14, 20], '#5a97d0'))
    case 9: return S(cloud('#8794a6') + drops([12, 16, 20, 23], '#2f6fb0'))
    case 10: return S(cloud('#aeb9c6') + drops([14, 20], '#5a97d0'))
    case 25: return S(cloud('#c3ccd7') + `<g stroke='#aab4c0' stroke-width='2' stroke-linecap='round'><line x1='9' y1='27' x2='23' y2='27'/><line x1='12' y1='30' x2='25' y2='30'/></g>`)
    default: return S(cloud('#94a2b4'))
  }
}

// ---------- static data ----------

export type MapGroup = 'mainland' | 'madeira' | 'azores'

export interface Capital {
  id: string; name: string; district: string; group: MapGroup; lat: number; lon: number
}

export const CAPITALS: Capital[] = [
  { id: 'viana', name: 'Viana do Castelo', district: 'Viana do Castelo', group: 'mainland', lat: 41.69, lon: -8.83 },
  { id: 'braga', name: 'Braga', district: 'Braga', group: 'mainland', lat: 41.55, lon: -8.43 },
  { id: 'vilareal', name: 'Vila Real', district: 'Vila Real', group: 'mainland', lat: 41.30, lon: -7.74 },
  { id: 'braganca', name: 'Bragança', district: 'Bragança', group: 'mainland', lat: 41.81, lon: -6.76 },
  { id: 'porto', name: 'Porto', district: 'Porto', group: 'mainland', lat: 41.15, lon: -8.61 },
  { id: 'aveiro', name: 'Aveiro', district: 'Aveiro', group: 'mainland', lat: 40.64, lon: -8.65 },
  { id: 'viseu', name: 'Viseu', district: 'Viseu', group: 'mainland', lat: 40.66, lon: -7.91 },
  { id: 'guarda', name: 'Guarda', district: 'Guarda', group: 'mainland', lat: 40.54, lon: -7.27 },
  { id: 'coimbra', name: 'Coimbra', district: 'Coimbra', group: 'mainland', lat: 40.21, lon: -8.43 },
  { id: 'castelobranco', name: 'Castelo Branco', district: 'Castelo Branco', group: 'mainland', lat: 39.82, lon: -7.49 },
  { id: 'leiria', name: 'Leiria', district: 'Leiria', group: 'mainland', lat: 39.74, lon: -8.81 },
  { id: 'santarem', name: 'Santarém', district: 'Santarém', group: 'mainland', lat: 39.23, lon: -8.69 },
  { id: 'portalegre', name: 'Portalegre', district: 'Portalegre', group: 'mainland', lat: 39.29, lon: -7.43 },
  { id: 'lisboa', name: 'Lisboa', district: 'Lisboa', group: 'mainland', lat: 38.72, lon: -9.14 },
  { id: 'setubal', name: 'Setúbal', district: 'Setúbal', group: 'mainland', lat: 38.52, lon: -8.89 },
  { id: 'evora', name: 'Évora', district: 'Évora', group: 'mainland', lat: 38.57, lon: -7.91 },
  { id: 'beja', name: 'Beja', district: 'Beja', group: 'mainland', lat: 38.02, lon: -7.86 },
  { id: 'faro', name: 'Faro', district: 'Faro', group: 'mainland', lat: 37.02, lon: -7.93 },
  { id: 'funchal', name: 'Funchal', district: 'Madeira', group: 'madeira', lat: 32.65, lon: -16.91 },
  { id: 'portosanto', name: 'Porto Santo', district: 'Madeira', group: 'madeira', lat: 33.07, lon: -16.34 },
  { id: 'pontadelgada', name: 'Ponta Delgada', district: 'Açores', group: 'azores', lat: 37.74, lon: -25.68 },
  { id: 'angra', name: 'Angra do Heroísmo', district: 'Açores', group: 'azores', lat: 38.66, lon: -27.22 },
  { id: 'horta', name: 'Horta', district: 'Açores', group: 'azores', lat: 38.54, lon: -28.63 },
]

export interface SeaPoint {
  id: string; name: string; group: MapGroup; lat: number; lon: number
  h: number; dir: string; period: number
}

export const SEA_POINTS: SeaPoint[] = [
  { id: 's_viana', name: 'Viana do Castelo', group: 'mainland', lat: 41.70, lon: -8.92, h: 2.5, dir: 'NW', period: 9 },
  { id: 's_leixoes', name: 'Leixões', group: 'mainland', lat: 41.18, lon: -8.75, h: 2.8, dir: 'NW', period: 10 },
  { id: 's_aveiro', name: 'Aveiro', group: 'mainland', lat: 40.64, lon: -8.80, h: 3.0, dir: 'NW', period: 10 },
  { id: 's_nazare', name: 'Nazaré', group: 'mainland', lat: 39.60, lon: -9.18, h: 3.6, dir: 'NW', period: 12 },
  { id: 's_cascais', name: 'Cascais', group: 'mainland', lat: 38.68, lon: -9.50, h: 2.4, dir: 'WNW', period: 9 },
  { id: 's_sines', name: 'Sines', group: 'mainland', lat: 37.92, lon: -8.95, h: 2.2, dir: 'W', period: 8 },
  { id: 's_sagres', name: 'Sagres', group: 'mainland', lat: 36.95, lon: -9.05, h: 2.6, dir: 'WSW', period: 9 },
  { id: 's_faro', name: 'Faro', group: 'mainland', lat: 36.92, lon: -7.93, h: 1.2, dir: 'SE', period: 6 },
  { id: 's_funchal', name: 'Madeira', group: 'madeira', lat: 32.60, lon: -16.95, h: 1.8, dir: 'NE', period: 7 },
  { id: 's_acores', name: 'Grupo Central', group: 'azores', lat: 38.50, lon: -28.70, h: 4.5, dir: 'NW', period: 13 },
  { id: 's_acores_e', name: 'Grupo Oriental', group: 'azores', lat: 37.74, lon: -25.50, h: 3.8, dir: 'NW', period: 12 },
]

// Static reference fire-risk values per district (1=Reduced … 5=Maximum).
// Replace with live IPMA risk data before presenting this as the current daily risk.
export const FIRE: Record<string, number> = {
  'Viana do Castelo': 2, 'Braga': 2, 'Porto': 2, 'Aveiro': 2,
  'Vila Real': 4, 'Bragança': 4, 'Viseu': 3, 'Guarda': 4,
  'Coimbra': 3, 'Castelo Branco': 5, 'Leiria': 3, 'Santarém': 4,
  'Portalegre': 5, 'Lisboa': 2, 'Setúbal': 3, 'Évora': 5,
  'Beja': 4, 'Faro': 4, 'Madeira': 2, 'Açores': 1,
}

export const WARN_TYPE: Record<string, { en: string; pt: string }> = {
  heat: { en: 'High temperature', pt: 'Tempo quente' },
  wind: { en: 'Wind', pt: 'Vento' },
  sea:  { en: 'Coastal waters', pt: 'Agitação marítima' },
  rain: { en: 'Precipitation', pt: 'Precipitação' },
  fog:  { en: 'Fog', pt: 'Nevoeiro' },
}

const DIR_DEG: Record<string, number> = {
  N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315,
  WNW: 292, WSW: 247, NNW: 337, NNE: 22, ENE: 67, ESE: 112, SSE: 157, SSW: 202,
}

export function dirDeg(dir: string): number {
  return DIR_DEG[dir] ?? 0
}

// Whether it is currently daytime (7am–8pm local)
export function isNowDaytime(): boolean {
  return new Date().getHours() >= 7 && new Date().getHours() < 20
}

// Classify lat/lon into geographic group for Portugal
export function geoGroup(lat: number, lon: number): MapGroup {
  if (lat < 34 && lon < -15) return 'madeira'
  if (lon < -22) return 'azores'
  return 'mainland'
}
