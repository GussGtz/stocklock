/**
 * Keeps the Render backend awake by pinging the health endpoint
 * every INTERVAL ms while the browser tab is visible.
 * Render free tier sleeps after ~15 min of inactivity.
 */

const INTERVAL = 9 * 60 * 1000  // 9 minutes — safely under the 15-min sleep threshold
const HEALTH_URL = `${import.meta.env.VITE_API_URL ?? '/api/v1'}/health`

let timer: ReturnType<typeof setInterval> | null = null

function ping() {
  if (document.visibilityState !== 'visible') return
  fetch(HEALTH_URL, { method: 'GET', credentials: 'omit' }).catch(() => {/* silence — backend may be waking */})
}

export function useKeepAlive() {
  function start() {
    if (timer) return
    ping()                                // immediate ping on mount
    timer = setInterval(ping, INTERVAL)
    document.addEventListener('visibilitychange', onVisibility)
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null }
    document.removeEventListener('visibilitychange', onVisibility)
  }

  function onVisibility() {
    if (document.visibilityState === 'visible') ping()  // ping immediately when user returns to tab
  }

  return { start, stop }
}
