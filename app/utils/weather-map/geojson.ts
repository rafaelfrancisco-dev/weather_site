import type {
  JSDistrict,
  JSLocation,
  JSStation,
  JSStationObservation,
} from '#shared/ipma-types'
import type { FcPoint, MapLayer } from '#shared/map-types'
import { buildDistrictGeoJSON } from '~/utils/districtGeoJSON'
import {
  mapboxFireColor,
  mapboxFireHaloColor,
  mapboxFireTextColor,
  mapboxLevelColor,
  mapboxTempColor,
  mapboxTempTextColor,
  mapboxUvColor,
  mapboxUvValueColor,
  mapboxWarningHaloColor,
  mapboxWarningTextColor,
  mapboxWaveColor,
} from '~/utils/mapColors'
import { latestStationTemperatures } from '~/utils/mapDerived'
import { SEA_POINTS } from '~/utils/maps'
import { weatherIconId } from '~/utils/weather-map/icons'

export interface LocationForecastCacheEntry {
  tmax: number | null
  wt: number | null
}

export function buildDistrictDataGeoJSON(options: {
  layer: MapLayer
  districtWarnings: Record<string, { type: string; level: string }>
  fireData: Record<string, number>
  forecastData: FcPoint[]
}): GeoJSON.FeatureCollection {
  const base = buildDistrictGeoJSON()
  return {
    type: 'FeatureCollection',
    features: base.features.map((feat) => {
      const name = feat.properties?.name as string
      let fillColor = '#f0f0f2'
      let labelText = ''
      let labelColor = '#1e2a3a'
      let labelHalo = '#ffffff'

      if (options.layer === 'warnings') {
        const warn = options.districtWarnings[name]
        const level = warn?.level as 'green' | 'yellow' | 'orange' | 'red' | undefined
        fillColor = level ? mapboxLevelColor(level) : '#f0f0f2'
        labelText = warn?.type ?? ''
        labelColor = level ? mapboxWarningTextColor(level) : '#1e2a3a'
        labelHalo = level ? mapboxWarningHaloColor(level) : '#ffffff'
      } else if (options.layer === 'fire') {
        const n = options.fireData[name] ?? 0
        fillColor = n > 0 ? mapboxFireColor(n) : '#f0f0f2'
        labelText = n > 0 ? String(n) : ''
        labelColor = n > 0 ? mapboxFireTextColor(n) : '#1e2a3a'
        labelHalo = n > 0 ? mapboxFireHaloColor(n) : '#ffffff'
      } else if (options.layer === 'forecast') {
        const fc = options.forecastData.find(f => f.district === name)
        fillColor = fc?.tmax != null ? mapboxTempColor(fc.tmax) : '#f0f0f2'
      }

      return { ...feat, properties: { ...feat.properties, fillColor, labelText, labelColor, labelHalo } }
    }),
  }
}

export function buildObsGeoJSON(
  stations: JSStation[],
  observations: JSStationObservation[],
): GeoJSON.FeatureCollection {
  const stationMap = new Map(stations.map(s => [s.id, s]))
  const features: GeoJSON.Feature[] = []
  for (const [id, temp] of latestStationTemperatures(observations)) {
    const s = stationMap.get(id)
    if (!s) continue
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [s.longitude, s.latitude] },
      properties: {
        stationID: id,
        stationName: s.name,
        temperature: temp,
        color: mapboxTempColor(temp),
        tempLabel: `${temp}°`,
        tempTextColor: mapboxTempTextColor(temp),
      },
    })
  }
  return { type: 'FeatureCollection', features }
}

export function buildLocationsGeoJSON(options: {
  locations: JSLocation[]
  districtMap: Map<number, JSDistrict>
  locationForecastCache: Map<number, LocationForecastCacheEntry>
  districtTempByName: Record<string, number>
  nationalAvgTemp: number
  isDaytime: boolean
}): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: options.locations.map((loc) => {
      const fc = options.locationForecastCache.get(loc.id)
      const hasForecast = fc != null && fc.tmax != null
      const districtName = options.districtMap.get(loc.districtID)?.name
      const clusterTemp = (districtName && options.districtTempByName[districtName] != null)
        ? options.districtTempByName[districtName]
        : options.nationalAvgTemp
      return {
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [loc.longitude, loc.latitude] },
        properties: {
          id: loc.id,
          name: loc.name,
          tempLabel: hasForecast ? `${fc.tmax}°` : '',
          tempTextColor: hasForecast ? mapboxTempTextColor(fc.tmax!) : '#1e2a3a',
          iconId: hasForecast && fc.wt != null ? weatherIconId(fc.wt, options.isDaytime) : '',
          clusterTemp,
        },
      }
    }),
  }
}

export function buildCapitalsGeoJSON(forecastData: FcPoint[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: forecastData.map(fc => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [fc.lon, fc.lat] },
      properties: {
        id: fc.id,
        name: fc.name,
        district: fc.district,
        tmax: fc.tmax,
        tmin: fc.tmin,
        uv: fc.uv,
        tempColor: fc.tmax != null ? mapboxTempColor(fc.tmax) : '#888888',
        uvColor: fc.uv != null ? mapboxUvColor(fc.uv) : '#888888',
        uvLabel: fc.uv != null ? `${fc.uv}` : '',
        uvLabelColor: fc.uv != null ? mapboxUvValueColor(fc.uv) : '#1e2a3a',
      },
    })),
  }
}

export function buildSeaGeoJSON(): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: SEA_POINTS.map(pt => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [pt.lon, pt.lat] },
      properties: {
        name: pt.name,
        h: pt.h,
        dir: pt.dir,
        period: pt.period,
        color: mapboxWaveColor(pt.h),
        label: `${pt.h}m`,
      },
    })),
  }
}
