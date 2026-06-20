import type { IPMAWeatherClient } from '~/utils/ipma-types'

type ClientState = {
  client: Ref<IPMAWeatherClient | null>
  ready: Ref<boolean>
  error: Ref<string | null>
}

let singleton: Promise<IPMAWeatherClient> | null = null
const client = ref<IPMAWeatherClient | null>(null)
const ready = ref(false)
const error = ref<string | null>(null)

async function loadClient(): Promise<IPMAWeatherClient> {
  const { init } = await import('ipma-weather-js')
  const config = useRuntimeConfig()
  const wasmUrl = `${config.app.baseURL}ipma-weather-js.opt.wasm`.replace(/\/+/g, '/')
  const { exports } = await init({
    module: fetch(wasmUrl),
    getImports: () => ({})
  })
  return new exports.IPMAWeatherClient()
}

export function useIpmaClient(): ClientState {
  if (!singleton) {
    singleton = loadClient()
    singleton
      .then((c) => {
        client.value = c
        ready.value = true
      })
      .catch((e) => {
        error.value = e instanceof Error ? e.message : String(e)
      })
  }

  return { client, ready, error }
}
