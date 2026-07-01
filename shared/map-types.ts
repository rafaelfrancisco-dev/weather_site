export type MapLayer = 'forecast' | 'observations' | 'warnings' | 'fire' | 'uv' | 'sea'
export type MapGroup = 'mainland' | 'madeira' | 'azores'

export interface MapFocus {
  group: MapGroup
  district?: string
}

export interface FcPoint {
  id: string
  name: string
  district: string
  group: MapGroup
  lat: number
  lon: number
  tmax: number | null
  tmin: number | null
  wt: number | null
  uv: number | null
}

export interface ObsPoint {
  id: number | string
  name: string
  group: MapGroup
  lat: number
  lon: number
  temp: number | null
}

export interface WarnEntry {
  type: string
  level: string
}

export interface MapPick {
  kind: 'location' | 'sea'
  id: string
  name: string
}
