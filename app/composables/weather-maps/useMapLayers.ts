import type { MapLayer } from '#shared/map-types'
import type { Lang, strings } from '~/utils/i18n'
import { fireColor, levelColor, tempFill, uvColor, waveFill } from '~/utils/colors'

export interface LayerDef {
  id: MapLayer
  label: string
  swatchColor: string
  unit: string
  hint: string
  legendTitle: string
  legendStops: { label: string; color: string }[]
}

export function useMapLayers(lang: ComputedRef<Lang>, t: ComputedRef<ReturnType<typeof strings>>) {
  const activeLayer = ref<MapLayer>('forecast')

  const layerDefs = computed<LayerDef[]>(() => [
    {
      id: 'forecast',
      label: t.value.forecast,
      swatchColor: 'oklch(0.78 0.14 62)',
      unit: '°C',
      hint: lang.value === 'pt' ? 'Máximas de hoje nas capitais de distrito.' : "Today's district-capital highs.",
      legendTitle: lang.value === 'pt' ? 'Temperatura °C' : 'Temperature °C',
      legendStops: [4, 9, 13, 17, 21, 25, 29, 33, 37].map(value => ({ label: String(value), color: tempFill(value) })),
    },
    {
      id: 'observations',
      label: t.value.obs,
      swatchColor: 'oklch(0.55 0.13 235)',
      unit: '°C',
      hint: lang.value === 'pt' ? 'Últimas temperaturas de estações automáticas.' : 'Latest automatic-station temperatures.',
      legendTitle: lang.value === 'pt' ? 'Temperatura °C' : 'Temperature °C',
      legendStops: [4, 9, 13, 17, 21, 25, 29, 33, 37].map(value => ({ label: String(value), color: tempFill(value) })),
    },
    {
      id: 'warnings',
      label: t.value.warnings,
      swatchColor: 'oklch(0.70 0.16 58)',
      unit: '',
      hint: lang.value === 'pt' ? 'Distritos com avisos ativos.' : 'Districts with active warnings.',
      legendTitle: lang.value === 'pt' ? 'Nível de aviso' : 'Awareness level',
      legendStops: [
        { label: lang.value === 'pt' ? 'Verde' : 'Green', color: levelColor('green') },
        { label: lang.value === 'pt' ? 'Amarelo' : 'Yellow', color: levelColor('yellow') },
        { label: lang.value === 'pt' ? 'Laranja' : 'Orange', color: levelColor('orange') },
        { label: lang.value === 'pt' ? 'Vermelho' : 'Red', color: levelColor('red') },
      ],
    },
    {
      id: 'fire',
      label: t.value.mapFire,
      swatchColor: 'oklch(0.57 0.20 30)',
      unit: '1-5',
      hint: lang.value === 'pt' ? 'Escala estática de referência por distrito.' : 'Static reference scale by district.',
      legendTitle: lang.value === 'pt' ? 'Risco de incêndio' : 'Fire risk',
      legendStops: [
        { label: '1', color: fireColor(1) },
        { label: '2', color: fireColor(2) },
        { label: '3', color: fireColor(3) },
        { label: '4', color: fireColor(4) },
        { label: '5', color: fireColor(5) },
      ],
    },
    {
      id: 'uv',
      label: t.value.mapUv,
      swatchColor: 'oklch(0.55 0.18 320)',
      unit: 'UV',
      hint: lang.value === 'pt' ? 'Índice UV máximo previsto.' : 'Forecast maximum UV index.',
      legendTitle: t.value.mapUv,
      legendStops: [
        { label: 'Low', color: uvColor(2) },
        { label: 'Moderate', color: uvColor(4) },
        { label: 'High', color: uvColor(7) },
        { label: 'Very high', color: uvColor(9) },
        { label: 'Extreme', color: uvColor(11) },
      ],
    },
    {
      id: 'sea',
      label: t.value.mapSea,
      swatchColor: 'oklch(0.52 0.14 252)',
      unit: 'm',
      hint: lang.value === 'pt' ? 'Pontos costeiros de referência.' : 'Reference coastal points.',
      legendTitle: lang.value === 'pt' ? 'Altura de onda' : 'Wave height',
      legendStops: [
        { label: '1m', color: waveFill(1) },
        { label: '2m', color: waveFill(2) },
        { label: '3m', color: waveFill(3) },
        { label: '4m', color: waveFill(4) },
        { label: '5m', color: waveFill(5) },
      ],
    },
  ])

  const activeLayerDef = computed(() => layerDefs.value.find(def => def.id === activeLayer.value) ?? layerDefs.value[0])

  function setLayer(nextLayer: MapLayer) {
    activeLayer.value = nextLayer
  }

  function legendTextColor(index: number) {
    if (activeLayer.value === 'warnings' && index === 1) return 'oklch(0.3 0.05 90)'
    if (activeLayer.value === 'forecast' || activeLayer.value === 'observations') {
      const value = Number(activeLayerDef.value.legendStops[index]?.label)
      return value >= 29 || value <= 9 ? '#fff' : 'oklch(0.25 0.02 255)'
    }
    return index >= activeLayerDef.value.legendStops.length - 2 ? '#fff' : 'oklch(0.25 0.03 60)'
  }

  return {
    activeLayer,
    layerDefs,
    activeLayerDef,
    setLayer,
    legendTextColor,
  }
}
