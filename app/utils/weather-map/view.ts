import type { MapFocus } from '#shared/map-types'
import { CAPITALS } from '~/utils/maps'

export interface InitialView {
  center: [number, number]
  zoom: number
}

export function getInitialView(focus: MapFocus | null): InitialView {
  const district = focus?.district
  const group = focus?.group
  if (district) {
    const cap = CAPITALS.find(c => c.district === district)
    if (cap) return { center: [cap.lon, cap.lat], zoom: 9 }
  }
  if (group === 'madeira') return { center: [-16.9, 32.65], zoom: 10 }
  if (group === 'azores') return { center: [-27.2, 38.6], zoom: 7 }
  return { center: [-8.2, 39.5], zoom: 6.3 }
}
