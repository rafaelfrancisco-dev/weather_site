// Frozen per-render clock. The server's render timestamp serializes into the
// Nuxt payload, so hydration recomputes with the *same* clock the HTML was
// built with, avoiding a hydration mismatch. Bumped to the real time once
// after hydration and again whenever the tab becomes visible, so computeds
// depending on it re-run and the UI snaps to true current time.
let nowListenersWired = false

export function useNow() {
  const now = useState<number>('app-now', () => Date.now())

  if (import.meta.client && !nowListenersWired) {
    nowListenersWired = true
    onNuxtReady(() => {
      now.value = Date.now()
    })
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        now.value = Date.now()
      }
    })
  }

  return now
}
