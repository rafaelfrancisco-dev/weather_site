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

// Response shape of /api/map-forecast-batch — today's headline values for a
// batch of location ids. Shared by the map's viewport fetch (WeatherMap.vue)
// and the district-focus list (useFocusedLocationForecasts.ts).
export interface MapForecastBatchEntry {
  id: string
  tmax: number | null
  tmin: number | null
  wt: number | null
}

export interface WarnEntry {
  type: string
  level: string
}

export interface MapPick {
  kind: 'location'
  id: string
  name: string
}
