// Meant for an uptime monitor: never calls IPMA upstream, only checks that
// the wasm client can load and that the cache storage driver round-trips.
export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')

  const [wasm, cache] = await Promise.all([
    isIpmaClientReady().catch(() => false),
    (async () => {
      try {
        const storage = useStorage('cache')
        const key = 'health:ping'
        await storage.setItem(key, Date.now())
        return (await storage.getItem(key)) != null
      } catch {
        return false
      }
    })()
  ])

  const ok = wasm && cache
  setResponseStatus(event, ok ? 200 : 503)
  return { ok, wasm, cache }
})
