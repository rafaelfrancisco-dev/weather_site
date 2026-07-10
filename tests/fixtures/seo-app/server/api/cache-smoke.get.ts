export default defineEventHandler(async () => {
  const storage = useStorage('cache')
  const key = 'integration:cache-smoke'
  const value = { ok: true }
  await storage.setItem(key, value)
  const stored = await storage.getItem(key)
  await storage.removeItem(key)
  return stored
})
