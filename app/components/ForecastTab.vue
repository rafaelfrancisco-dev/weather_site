<script setup lang="ts">
import type { HourlyGrid, DailyRow } from '~/utils/transform'
import type { DailyRangeModel, MeteogramModel } from '~/utils/charts'
import { densityStyles } from '~/composables/useSettings'

const props = defineProps<{
  hourlyGrid: HourlyGrid
  dailyRows: DailyRow[]
  meteogram: MeteogramModel | null
  dailyRange: DailyRangeModel | null
  primary: string
  t: Record<string, string>
}>()

const settings = useSettings()
const dens = computed(() => densityStyles(settings.value.density))
const { mobile } = useViewport()
const forecastRoot = ref<HTMLElement | null>(null)

// Skeleton heights mirror the chart cards (chart area + legend row + padding)
// so the charts pop in without layout shift.
const CHART_CARD_CHROME = 45 // legend row + card padding + border
const meteogramSkeletonHeight = computed(() => {
  const chart = mobile.value ? 180 : (settings.value.density === 'Compact' ? 190 : 220)
  return `${chart + CHART_CARD_CHROME}px`
})
const tempRangeSkeletonHeight = computed(() => {
  const chart = mobile.value || settings.value.density === 'Compact' ? 170 : 200
  return `${chart + CHART_CARD_CHROME}px`
})

const SKELETON_DAILY_ROWS = 10
const SKELETON_DAY_GROUPS = 3
const SKELETON_COLS_PER_DAY = 8
const skeletonCols = SKELETON_DAY_GROUPS * SKELETON_COLS_PER_DAY

const skeletonHourRows = computed(() => [
  { label: props.t.weather, unit: '', isIcon: true },
  { label: props.t.temp, unit: '°C' },
  { label: props.t.feels, unit: '°C' },
  { label: props.t.precipProb, unit: '' },
  { label: props.t.wind, unit: '' },
  { label: props.t.windSpd, unit: 'km/h' },
  { label: props.t.humidity, unit: '%' }
])

function scrollCurrentHourIntoView() {
  if (!import.meta.client) return
  nextTick(() => {
    const current = forecastRoot.value?.querySelector<HTMLElement>('.hourly-card--current')
    const strip = current?.parentElement
    if (!current || !strip) return
    strip.scrollLeft = current.offsetLeft - ((strip.clientWidth - current.offsetWidth) / 2)
  })
}

watch(
  () => props.hourlyGrid.hourDays
    .map(day => day.cells.map(cell => cell.isCurrent ? '1' : '0').join(''))
    .join('|'),
  scrollCurrentHourIntoView,
  { immediate: true, flush: 'post' }
)
onMounted(scrollCurrentHourIntoView)
</script>

<template>
  <div ref="forecastRoot">
    <div style="font-size:13.5px; font-weight:600; color:var(--text-heading); margin-bottom:8px;">{{ props.t.hourly }}</div>

    <div style="margin-bottom:14px;">
      <ClientOnly>
        <LazyChartsMeteogram v-if="props.meteogram" :model="props.meteogram" :mobile="mobile" :primary="props.primary" :t="props.t" />
        <div v-else :style="{ height: meteogramSkeletonHeight, border: '1px solid oklch(0.89 0.008 255)', borderRadius: '7px', background: '#fff' }"></div>
        <template #fallback>
          <div :style="{ height: meteogramSkeletonHeight, border: '1px solid oklch(0.89 0.008 255)', borderRadius: '7px', background: '#fff' }"></div>
        </template>
      </ClientOnly>
    </div>

    <!-- desktop hourly grid -->
    <div class="variant-desktop" style="border:1px solid oklch(0.89 0.008 255); border-radius:7px; overflow:hidden; background:#fff; margin-bottom:26px;">
      <div style="overflow-x:auto;">
        <table style="border-collapse:collapse; width:100%; min-width:760px;">
          <thead>
            <tr>
              <th style="position:sticky; left:0; z-index:6; background:oklch(0.97 0.005 255); border-bottom:1px solid var(--border); border-right:1px solid var(--border); min-width:118px;"></th>
              <th
                v-for="(dh, i) in props.hourlyGrid.dayHeaders"
                :key="i"
                :colspan="dh.span"
                style="background:oklch(0.97 0.005 255); border-bottom:1px solid var(--border); border-left:2px solid oklch(0.85 0.01 255); padding:6px 8px; font-size:12px; font-weight:600; color:var(--text-heading); text-align:left; white-space:nowrap;"
              >{{ dh.label }}</th>
            </tr>
            <tr>
              <th style="position:sticky; left:0; z-index:6; background:oklch(0.97 0.005 255); border-bottom:1px solid oklch(0.86 0.008 255); border-right:1px solid var(--border);"></th>
              <th
                v-for="(col, i) in props.hourlyGrid.timeCols"
                :key="i"
                :style="{ background: col.isCurrent ? 'oklch(0.88 0.012 255)' : 'oklch(0.985 0.004 255)', borderBottom: col.isCurrent ? '2px solid oklch(0.65 0.02 255)' : '1px solid oklch(0.86 0.008 255)', borderLeft: col.sep, padding: '4px 0', fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px', fontWeight: col.isCurrent ? 700 : 500, color: col.isCurrent ? 'oklch(0.28 0.02 255)' : 'var(--text-muted)', width: '42px', textAlign: 'center' }"
              >{{ col.label }}</th>
            </tr>
          </thead>
          <tbody v-if="props.hourlyGrid.hourRows.length === 0">
            <tr v-for="(row, ri) in skeletonHourRows" :key="ri">
              <th
                :style="{ position: 'sticky', left: 0, zIndex: 5, background: '#fff', borderBottom: '1px solid oklch(0.93 0.006 255)', borderRight: '1px solid var(--border)', padding: dens.pad, textAlign: 'left', fontWeight: 500, fontSize: dens.fz, color: 'oklch(0.34 0.012 255)', whiteSpace: 'nowrap' }"
              >
                {{ row.label }} <span style="color:oklch(0.62 0.01 255); font-size:10.5px; font-weight:400;">{{ row.unit }}</span>
              </th>
              <td
                v-for="ci in skeletonCols"
                :key="ci"
                style="border-bottom:1px solid var(--border-subtle); padding:7px 3px; text-align:center; vertical-align:middle;"
              >
                <div v-if="row.isIcon" style="width:26px; height:26px; border-radius:5px; background:oklch(0.93 0.005 255); margin:0 auto;"></div>
                <div v-else style="font-family:'IBM Plex Mono',monospace; font-size:13px; color:var(--text-faint);">—</div>
              </td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr v-for="(row, ri) in props.hourlyGrid.hourRows" :key="ri">
              <th
                :style="{ position: 'sticky', left: 0, zIndex: 5, background: '#fff', borderBottom: '1px solid oklch(0.93 0.006 255)', borderRight: '1px solid var(--border)', padding: dens.pad, textAlign: 'left', fontWeight: 500, fontSize: dens.fz, color: 'oklch(0.34 0.012 255)', whiteSpace: 'nowrap' }"
              >
                {{ row.label }} <span style="color:oklch(0.62 0.01 255); font-size:10.5px; font-weight:400;">{{ row.unit }}</span>
              </th>
              <td
                v-for="(cell, ci) in row.cells"
                :key="ci"
                :style="{ borderBottom: '1px solid var(--border-subtle)', borderLeft: cell.sep, background: cell.isCurrent ? `linear-gradient(rgba(78, 92, 112, 0.08), rgba(78, 92, 112, 0.08)), ${cell.bg}` : cell.bg, padding: dens.cellPad, textAlign: 'center', verticalAlign: 'middle' }"
              >
                <img v-if="cell.isIcon && cell.icon" :src="cell.icon" :title="cell.title" :alt="cell.title" loading="lazy" decoding="async" style="width:26px; height:26px; display:block; margin:0 auto;" />
                <div v-else-if="cell.isWind" style="display:flex; flex-direction:column; align-items:center; gap:1px;">
                  <span :style="{ display: 'inline-block', fontSize: '14px', lineHeight: '1', color: 'oklch(0.42 0.04 255)', transform: `rotate(${cell.deg}deg)` }">↑</span>
                  <span style="font-size:9px; font-family:'IBM Plex Mono',monospace; color:var(--text-subtle);">{{ cell.main }}</span>
                </div>
                <template v-else-if="cell.isText">
                  <div :style="{ fontFamily: 'IBM Plex Mono, monospace', fontSize: dens.fz, fontWeight: cell.weight, color: cell.color }">{{ cell.main }}</div>
                  <div v-if="cell.showBar" style="height:3px; margin:3px 5px 0; border-radius:2px; background:oklch(0.92 0.01 255);">
                    <div :style="{ height: '100%', width: cell.barH, background: cell.barColor, borderRadius: '2px' }"></div>
                  </div>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- mobile hourly cards -->
    <div class="variant-mobile mobile-hourly" style="margin-bottom:24px;">
      <template v-if="props.hourlyGrid.hourDays.length === 0">
        <div v-for="di in SKELETON_DAY_GROUPS" :key="di">
          <div style="font-size:12px; font-weight:600; color:oklch(0.45 0.012 255); margin-bottom:7px; font-family:'IBM Plex Mono',monospace;">—</div>
          <div class="hourly-strip">
            <div v-for="ci in SKELETON_COLS_PER_DAY" :key="ci" class="hourly-card" style="border:1px solid oklch(0.9 0.006 255); background:#fff; padding:9px 6px;">
              <span style="font-family:'IBM Plex Mono',monospace; font-size:11.5px; color:var(--text-muted);">—</span>
              <div style="width:30px; height:30px; border-radius:6px; background:oklch(0.93 0.005 255);"></div>
              <span style="font-family:'IBM Plex Mono', monospace; font-size:17px; font-weight:600; color:var(--text-faint);">—</span>
              <span style="display:flex; align-items:center; gap:3px; font-family:'IBM Plex Mono', monospace; font-size:11px; color:var(--text-faint);">
                <span style="width:6px; height:6px; border-radius:50%; background:oklch(0.88 0.006 255);"></span>—
              </span>
              <span style="font-family:'IBM Plex Mono',monospace; font-size:10px; color:var(--text-subtle);">—</span>
            </div>
          </div>
        </div>
      </template>
      <template v-else>
        <div v-for="(hd, di) in props.hourlyGrid.hourDays" :key="di">
          <div style="font-size:12px; font-weight:600; color:oklch(0.45 0.012 255); margin-bottom:7px; font-family:'IBM Plex Mono',monospace;">{{ hd.label }}</div>
          <div class="hourly-strip">
            <div v-for="(hc, ci) in hd.cells" :key="ci" class="hourly-card" :class="{ 'hourly-card--current': hc.isCurrent }" :style="{ border: hc.isCurrent ? '2px solid oklch(0.65 0.02 255)' : '1px solid oklch(0.9 0.006 255)', background: hc.isCurrent ? 'oklch(0.93 0.009 255)' : '#fff', padding: hc.isCurrent ? '8px 5px' : '9px 6px' }">
              <span style="font-family:'IBM Plex Mono',monospace; font-size:11.5px; color:var(--text-muted);">{{ hc.time }}</span>
              <img v-if="hc.icon" :src="hc.icon" :alt="hc.title" :title="hc.title" loading="lazy" decoding="async" style="width:30px; height:30px;" />
              <span :style="{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '17px', fontWeight: 600, color: hc.tempColor }">{{ hc.temp }}°</span>
              <span :style="{ display: 'flex', alignItems: 'center', gap: '3px', fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px', color: hc.ppColor }">
                <span style="width:6px; height:6px; border-radius:50%; background:oklch(0.6 0.13 250);"></span>{{ hc.pp }}%
              </span>
              <span style="display:flex; flex-direction:column; align-items:center;">
                <span :style="{ fontSize: '13px', lineHeight: '1', color: 'oklch(0.45 0.03 255)', transform: `rotate(${hc.deg}deg)` }">↑</span>
                <span style="font-family:'IBM Plex Mono',monospace; font-size:10px; color:var(--text-subtle);">{{ hc.ws ?? '—' }}</span>
              </span>
            </div>
          </div>
        </div>
      </template>
    </div>

    <div style="font-size:13.5px; font-weight:600; color:var(--text-heading); margin-bottom:8px;">{{ props.t.tenDay }}</div>

    <!-- desktop 10-day table -->
    <div class="variant-desktop" style="border:1px solid oklch(0.89 0.008 255); border-radius:7px; overflow:hidden; background:#fff;">
      <div style="overflow-x:auto;">
        <table style="border-collapse:collapse; width:100%; min-width:680px;">
          <thead>
            <tr style="background:oklch(0.97 0.005 255);">
              <th style="text-align:left; padding:8px 12px; font-size:11px; font-weight:600; color:var(--text-muted); border-bottom:1px solid var(--border); letter-spacing:0.03em; text-transform:uppercase;">{{ props.t.day }}</th>
              <th style="padding:8px; font-size:11px; font-weight:600; color:var(--text-muted); border-bottom:1px solid var(--border); letter-spacing:0.03em; text-transform:uppercase;">{{ props.t.weather }}</th>
              <th style="padding:8px; font-size:11px; font-weight:600; color:var(--text-muted); border-bottom:1px solid var(--border); letter-spacing:0.03em; text-transform:uppercase;">{{ props.t.minmax }}</th>
              <th style="padding:8px; font-size:11px; font-weight:600; color:var(--text-muted); border-bottom:1px solid var(--border); letter-spacing:0.03em; text-transform:uppercase;">{{ props.t.precipProb }}</th>
              <th style="padding:8px; font-size:11px; font-weight:600; color:var(--text-muted); border-bottom:1px solid var(--border); letter-spacing:0.03em; text-transform:uppercase;">{{ props.t.wind }}</th>
              <th style="padding:8px; font-size:11px; font-weight:600; color:var(--text-muted); border-bottom:1px solid var(--border); letter-spacing:0.03em; text-transform:uppercase;">UV</th>
            </tr>
          </thead>
          <tbody v-if="props.dailyRows.length === 0">
            <tr v-for="i in SKELETON_DAILY_ROWS" :key="i">
              <td style="padding:7px 12px; border-bottom:1px solid var(--border-subtle); white-space:nowrap;">
                <span style="font-weight:600; font-size:13px; color:var(--text-faint);">—</span>
                <span style="font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--text-faint); margin-left:6px;">—</span>
              </td>
              <td style="padding:5px 8px; border-bottom:1px solid var(--border-subtle);">
                <div style="display:flex; align-items:center; gap:8px;">
                  <div style="width:28px; height:28px; border-radius:6px; background:oklch(0.93 0.005 255); flex:none;"></div>
                  <span style="font-size:12px; color:var(--text-faint);">—</span>
                </div>
              </td>
              <td style="padding:7px 8px; border-bottom:1px solid var(--border-subtle); text-align:center; white-space:nowrap; font-family:'IBM Plex Mono',monospace; font-size:13px; color:var(--text-faint);">— / —</td>
              <td style="padding:7px 8px; border-bottom:1px solid var(--border-subtle); text-align:center; font-family:'IBM Plex Mono',monospace; font-size:12.5px; color:var(--text-faint);">—</td>
              <td style="padding:7px 8px; border-bottom:1px solid var(--border-subtle); text-align:center; font-family:'IBM Plex Mono',monospace; font-size:11.5px; color:var(--text-faint);">—</td>
              <td style="padding:7px 8px; border-bottom:1px solid var(--border-subtle); text-align:center; font-family:'IBM Plex Mono',monospace; font-size:12.5px; color:var(--text-faint);">—</td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr v-for="(d, i) in props.dailyRows" :key="i" :style="{ background: d.rowBg }">
              <td style="padding:7px 12px; border-bottom:1px solid var(--border-subtle); white-space:nowrap;">
                <span style="font-weight:600; font-size:13px; color:oklch(0.28 0.012 255);">{{ d.dow }}</span>
                <span style="font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--text-subtle); margin-left:6px;">{{ d.date }}</span>
              </td>
              <td style="padding:5px 8px; border-bottom:1px solid var(--border-subtle);">
                <div style="display:flex; align-items:center; gap:8px;">
                  <img v-if="d.icon" :src="d.icon" :alt="d.wt" loading="lazy" decoding="async" style="width:28px; height:28px; flex:none;" />
                  <span style="font-size:12px; color:oklch(0.40 0.012 255);">{{ d.wt }}</span>
                </div>
              </td>
              <td style="padding:7px 8px; border-bottom:1px solid var(--border-subtle); text-align:center; white-space:nowrap; font-family:'IBM Plex Mono',monospace; font-size:13px;">
                <span :style="{ color: d.minColor, fontWeight: 500 }">{{ d.tmin }}°</span>
                <span style="color:oklch(0.78 0.01 255); margin:0 3px;">/</span>
                <span :style="{ color: d.maxColor, fontWeight: 600 }">{{ d.tmax }}°</span>
              </td>
              <td :style="{ padding: '7px 8px', borderBottom: '1px solid var(--border-subtle)', textAlign: 'center', fontFamily: 'IBM Plex Mono, monospace', fontSize: '12.5px', color: d.precipColor }">{{ d.precipProb }}%</td>
              <td style="padding:7px 8px; border-bottom:1px solid var(--border-subtle); text-align:center; white-space:nowrap;">
                <span :style="{ display: 'inline-block', fontSize: '13px', color: 'oklch(0.45 0.03 255)', transform: `rotate(${d.deg}deg)`, verticalAlign: 'middle' }">↑</span>
                <span style="font-family:'IBM Plex Mono',monospace; font-size:11.5px; color:var(--text-muted); margin-left:5px;">{{ d.windSpeed }}</span>
              </td>
              <td style="padding:7px 8px; border-bottom:1px solid var(--border-subtle); text-align:center;">
                <span style="display:inline-flex; align-items:center; gap:5px;">
                  <span :style="{ width: '7px', height: '7px', borderRadius: '50%', background: d.uvColor }"></span>
                  <span style="font-family:'IBM Plex Mono',monospace; font-size:12.5px; color:oklch(0.4 0.012 255);">{{ d.uv }}</span>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- mobile 10-day rows -->
    <div class="variant-mobile" style="border:1px solid oklch(0.89 0.008 255); border-radius:10px; overflow:hidden; background:#fff;">
      <template v-if="props.dailyRows.length === 0">
        <div v-for="i in SKELETON_DAILY_ROWS" :key="i" style="display:flex; align-items:center; gap:10px; padding:10px 12px; border-bottom:1px solid var(--border-subtle);">
          <div style="flex:none; width:52px;">
            <div style="font-size:13px; font-weight:600; color:var(--text-faint);">—</div>
            <div style="font-family:'IBM Plex Mono',monospace; font-size:10.5px; color:var(--text-faint);">—</div>
          </div>
          <div style="width:30px; height:30px; border-radius:6px; background:oklch(0.93 0.005 255); flex:none;"></div>
          <div style="flex:1; min-width:0; display:flex; align-items:center; gap:5px; font-family:'IBM Plex Mono', monospace; font-size:11.5px; color:var(--text-faint);">
            <span style="width:6px; height:6px; border-radius:50%; background:oklch(0.88 0.006 255); flex:none;"></span>—
          </div>
          <div style="flex:none; font-family:'IBM Plex Mono',monospace; font-size:14px; text-align:right; min-width:64px; color:var(--text-faint);">— / —</div>
        </div>
      </template>
      <template v-else>
        <div v-for="(d, i) in props.dailyRows" :key="i" :style="{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)', background: d.rowBg }">
          <div style="flex:none; width:52px;">
            <div style="font-size:13px; font-weight:600; color:oklch(0.28 0.012 255);">{{ d.dow }}</div>
            <div style="font-family:'IBM Plex Mono',monospace; font-size:10.5px; color:var(--text-subtle);">{{ d.date }}</div>
          </div>
          <img v-if="d.icon" :src="d.icon" :alt="d.wt" loading="lazy" decoding="async" style="width:30px; height:30px; flex:none;" />
          <div :style="{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'IBM Plex Mono, monospace', fontSize: '11.5px', color: d.precipColor }">
            <span style="width:6px; height:6px; border-radius:50%; background:oklch(0.6 0.13 250); flex:none;"></span>{{ d.precipProb }}%
          </div>
          <div style="flex:none; font-family:'IBM Plex Mono',monospace; font-size:14px; text-align:right; min-width:64px;">
            <span :style="{ color: d.maxColor, fontWeight: 600 }">{{ d.tmax }}°</span>
            <span style="color:oklch(0.78 0.01 255);"> / </span>
            <span :style="{ color: d.minColor }">{{ d.tmin }}°</span>
          </div>
        </div>
      </template>
    </div>

    <div style="font-size:13.5px; font-weight:600; color:var(--text-heading); margin:26px 0 8px;">{{ props.t.tempRangeChart }}</div>
    <ClientOnly>
      <LazyChartsTempRange v-if="props.dailyRange" :model="props.dailyRange" :mobile="mobile" :t="props.t" />
      <div v-else :style="{ height: tempRangeSkeletonHeight, border: '1px solid oklch(0.89 0.008 255)', borderRadius: '7px', background: '#fff' }"></div>
      <template #fallback>
        <div :style="{ height: tempRangeSkeletonHeight, border: '1px solid oklch(0.89 0.008 255)', borderRadius: '7px', background: '#fff' }"></div>
      </template>
    </ClientOnly>
  </div>
</template>

<style scoped>
.variant-mobile {
  display: none;
}

.mobile-hourly {
  flex-direction: column;
  gap: 14px;
}

.hourly-strip {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 6px;
  scroll-snap-type: x proximity;
  -webkit-overflow-scrolling: touch;
  mask-image: linear-gradient(90deg, transparent, #000 14px, #000 calc(100% - 24px), transparent);
}

.hourly-card {
  display: flex;
  flex: none;
  width: 74px;
  scroll-snap-align: start;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  border-radius: 10px;
}

@media (max-width: 700px), ((pointer: coarse) and (max-width: 1024px)) {
  .variant-desktop {
    display: none;
  }

  .variant-mobile {
    display: block;
  }

  .mobile-hourly {
    display: flex;
  }
}
</style>
