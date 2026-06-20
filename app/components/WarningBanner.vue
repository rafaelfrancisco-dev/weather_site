<script setup lang="ts">
import type { WarningBanner } from '~/utils/transform'

const props = defineProps<{
  data: WarningBanner
}>()
</script>

<template>
  <div
    v-if="props.data.hasWarn && props.data.banner"
    :style="{ display: 'flex', alignItems: 'stretch', border: `1px solid ${props.data.banner.color}`, borderLeft: `5px solid ${props.data.banner.color}`, borderRadius: '6px', background: props.data.banner.soft, marginBottom: '16px', overflow: 'hidden' }"
  >
    <div :style="{ flex: 'none', background: props.data.banner.color, color: '#fff', padding: '11px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '92px' }">
      <span style="font-size:9.5px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; opacity:0.85;">{{ props.data.banner.levelLabel }}</span>
      <span style="font-size:15px; font-weight:700;">{{ props.data.banner.level }}</span>
    </div>
    <div style="padding:10px 14px; display:flex; flex-direction:column; justify-content:center;">
      <div style="font-size:13.5px; font-weight:600; color:oklch(0.28 0.02 255);">{{ props.data.banner.type }}</div>
      <div style="font-size:12px; color:oklch(0.42 0.012 255); margin-top:2px;">
        {{ props.data.banner.text }}
        <span style="font-family:'IBM Plex Mono',monospace; color:oklch(0.5 0.01 255);">· {{ props.data.banner.window }}</span>
      </div>
    </div>
  </div>
</template>
