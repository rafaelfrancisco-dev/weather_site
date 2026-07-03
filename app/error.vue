<script setup lang="ts">
import type { NuxtError } from '#app'
import { accentColors } from '~/utils/colors'
import { LAST_LOCATION_COOKIE } from '#shared/slug'

const props = defineProps<{ error: NuxtError }>()

const settings = useSettings()
const c = computed(() => accentColors(settings.value.accent))
const pt = computed(() => settings.value.lang === 'pt')

const is404 = computed(() => props.error.statusCode === 404)
const title = computed(() => is404.value
  ? (pt.value ? 'Página não encontrada' : 'Page not found')
  : (pt.value ? 'Ocorreu um erro' : 'Something went wrong'))
const detail = computed(() => is404.value
  ? (pt.value ? 'O endereço que procura não existe ou foi movido.' : 'The address you were looking for does not exist or has moved.')
  : (props.error.statusMessage ?? (pt.value ? 'Tente novamente dentro de momentos.' : 'Please try again in a moment.')))

function goHome() {
  // A stale cookie pointing at a location that no longer exists (e.g. it was
  // removed upstream) would otherwise loop `/ → /location/{id} → 404` forever.
  useCookie(LAST_LOCATION_COOKIE, { path: '/' }).value = null
  clearError({ redirect: '/' })
}
</script>

<template>
  <div style="height:100vh; height:100dvh; display:flex; align-items:center; justify-content:center; background:var(--bg-page); color:oklch(0.24 0.012 255); font-family:'IBM Plex Sans', system-ui, sans-serif; padding:20px;">
    <div style="text-align:center; max-width:420px;">
      <div style="font-weight:700; font-size:18px; letter-spacing:0.04em; margin-bottom:22px;">MET<span style="opacity:0.55;">·</span>PT</div>
      <div :style="{ fontSize: '52px', fontWeight: 700, lineHeight: 1, color: c.primary, fontFamily: `'IBM Plex Mono', monospace` }">{{ error.statusCode }}</div>
      <h1 style="font-size:17px; font-weight:600; margin:14px 0 6px;">{{ title }}</h1>
      <p style="font-size:13.5px; color:oklch(0.45 0.01 255); margin:0 0 22px; line-height:1.6;">{{ detail }}</p>
      <button
        :style="{ border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600, color: '#fff', background: c.primary, padding: '10px 18px', borderRadius: '7px' }"
        @click="goHome"
      >{{ pt ? 'Voltar ao início' : 'Back to home' }}</button>
    </div>
  </div>
</template>
