import type { WarnEntry } from '#shared/map-types'
import type { JSDistrict, JSLocation, JSStation, JSStationObservation, JSWeatherWarning } from '#shared/ipma-types'
import { levelRank } from '~/utils/colors'
import { isWarningActive, normalizeLevel } from '~/utils/transform'

export interface ObservationStationPoint {
  id: number
  name: string
  lat: number
  lon: number
  temp: number
  dist: number
}

export function latestStationTemperatures(observations: JSStationObservation[]): Map<number, number> {
  const latest = new Map<number, number>()
  const sorted = [...observations].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  for (const obs of sorted) {
    if (!latest.has(obs.stationID) && obs.temperature != null) latest.set(obs.stationID, obs.temperature)
  }
  return latest
}

export function nearestObservationStations(
  stations: JSStation[],
  observations: JSStationObservation[],
  center: { lat: number; lon: number },
  max: number,
): ObservationStationPoint[] {
  const stationMap = new Map(stations.map(s => [s.id, s]))
  return [...latestStationTemperatures(observations).entries()]
    .map(([id, temp]) => {
      const station = stationMap.get(id)
      if (!station) return null
      const dlat = station.latitude - center.lat
      const dlon = station.longitude - center.lon
      return {
        id,
        name: station.name,
        lat: station.latitude,
        lon: station.longitude,
        temp,
        dist: dlat * dlat + dlon * dlon,
      }
    })
    .filter((point): point is ObservationStationPoint => point != null)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, max)
}

export function districtWarningEntries(
  locations: JSLocation[],
  districtMap: Map<number, JSDistrict>,
  warningsByArea: Map<string, JSWeatherWarning[]>,
  now = new Date(),
): Record<string, WarnEntry> {
  const result: Record<string, WarnEntry> = {}
  const districtAreaId = new Map<number, string>()
  for (const loc of locations) {
    if (!districtAreaId.has(loc.districtID)) districtAreaId.set(loc.districtID, loc.warningAreaID)
  }

  for (const [districtId, areaId] of districtAreaId) {
    const district = districtMap.get(districtId)
    if (!district) continue

    const active = (warningsByArea.get(areaId) ?? []).filter(w => {
      const level = normalizeLevel(w)
      return level !== 'green' && isWarningActive(w, now)
    })
    if (!active.length) continue

    const top = active.reduce((best, warning) =>
      levelRank(normalizeLevel(warning)) > levelRank(normalizeLevel(best)) ? warning : best
    )
    result[district.name] = { type: top.awarenessTypeName, level: normalizeLevel(top) }
  }

  return result
}
