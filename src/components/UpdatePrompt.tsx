import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Re-check the service worker for a new version this often. iOS aggressively
// suspends PWAs and may miss the normal update lifecycle, so we poll.
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000 // 1 hour

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return
      setInterval(() => {
        registration.update().catch(() => {
          // ignore; network errors are non-fatal — we'll retry next interval
        })
      }, UPDATE_CHECK_INTERVAL_MS)
    },
  })

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 rounded-lg bg-primary text-primary-foreground shadow-lg px-4 py-3 flex items-center gap-3 animate-in slide-in-from-bottom-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">New version available</p>
        <p className="text-xs opacity-90 mt-0.5">Reload to update the app.</p>
      </div>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => updateServiceWorker(true)}
      >
        <RefreshCw className="h-4 w-4 mr-1" />
        Reload
      </Button>
      <button
        onClick={() => setNeedRefresh(false)}
        className="shrink-0 opacity-70 hover:opacity-100"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
