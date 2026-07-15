import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { CloudAlert, Loader2 } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { useSyncResolution } from '@/hooks/useSyncResolution'
import { onSyncStatusChange } from '@/lib/sync-scheduler'
import { queryKeys } from '@/lib/query-keys'
import { SyncConflictDialog } from '@/components/settings/SyncConflictDialog'

// App-wide nudge for the one sync state the automatic scheduler can't resolve
// on its own: it found the cloud diverged from this device and backed off
// rather than clobbering it (needsAttention), or a push errored (lastError).
// Both leave sync silently paused — this banner makes that impossible to miss
// on any tab, and taps through to the same "Sync now" → conflict-resolver flow
// as Settings. Shown only when sync is actually enabled.
export function SyncAttentionBanner() {
  const { data: settings } = useSettings()
  const qc = useQueryClient()
  const {
    syncingNow,
    conflict,
    resolving,
    setConflict,
    handleSyncNow,
    handleKeepLocal,
    handleUseRemote,
  } = useSyncResolution()

  // The scheduler writes githubSync outside React Query, so subscribe to its
  // status changes and invalidate the settings query — otherwise the banner
  // wouldn't appear until the next refetch (up to staleTime later).
  useEffect(() => {
    return onSyncStatusChange(() => {
      qc.invalidateQueries({ queryKey: queryKeys.settings })
    })
  }, [qc])

  const gs = settings?.githubSync
  const enabled = gs?.enabled ?? false
  const needsAttention = gs?.needsAttention ?? false
  const hasError = !!gs?.lastError

  // A conflict dialog may already be open (resolution in flight) even after the
  // underlying flag clears, so keep rendering the dialog while `conflict` is set.
  if (!enabled || (!needsAttention && !hasError)) {
    return (
      <SyncConflictDialog
        open={!!conflict}
        remoteExportedAt={conflict?.exportedAt}
        busy={resolving}
        onKeepLocal={handleKeepLocal}
        onUseRemote={handleUseRemote}
        onCancel={() => setConflict(null)}
      />
    )
  }

  const message = hasError
    ? 'Sync failed — your latest changes are not backed up.'
    : 'Sync paused — the cloud changed on another device.'

  return (
    <>
      <button
        type="button"
        onClick={handleSyncNow}
        disabled={syncingNow}
        className="w-full flex items-center gap-2 bg-amber-500/15 text-amber-600 dark:text-amber-400 border-b border-amber-500/30 px-4 py-2 text-left text-xs font-medium disabled:opacity-70"
      >
        {syncingNow ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
        ) : (
          <CloudAlert className="h-4 w-4 shrink-0" />
        )}
        <span className="flex-1">{message}</span>
        <span className="shrink-0 underline underline-offset-2">
          {syncingNow ? 'Syncing…' : 'Resolve'}
        </span>
      </button>

      <SyncConflictDialog
        open={!!conflict}
        remoteExportedAt={conflict?.exportedAt}
        busy={resolving}
        onKeepLocal={handleKeepLocal}
        onUseRemote={handleUseRemote}
        onCancel={() => setConflict(null)}
      />
    </>
  )
}
