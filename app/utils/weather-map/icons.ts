import type { Map } from 'mapbox-gl'
import { iconSvg } from '~/utils/maps'

const WEATHER_TYPES = [1, 2, 3, 4, 5, 6, 7, 9, 10, 25]
const ICON_SIZE = 64

export function weatherIconId(wt: number, day: boolean): string {
  return `wt-icon-${wt}-${day ? 'd' : 'n'}`
}

function svgToImageData(svgDataUri: string, size = ICON_SIZE): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('no 2d context'))
        return
      }
      ctx.drawImage(img, 0, 0, size, size)
      resolve(ctx.getImageData(0, 0, size, size))
    }
    img.onerror = () => reject(new Error('icon failed to load'))
    img.src = svgDataUri
  })
}

export async function loadWeatherIcons(map: Map) {
  for (const wt of WEATHER_TYPES) {
    for (const day of [true, false]) {
      const id = weatherIconId(wt, day)
      if (map.hasImage(id)) continue
      try {
        const data = await svgToImageData(iconSvg(wt, day))
        if (!map.hasImage(id)) map.addImage(id, data)
      } catch {
        // Marker rendering falls back to a plain circle.
      }
    }
  }
}
