import { Dialog, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

// Shown when a manual sync finds that BOTH this device and the cloud changed
// since the last sync (true divergence) — the one case that can't be resolved
// automatically. The parent owns the async resolution; this dialog is dumb.
export function SyncConflictDialog({
  open,
  remoteExportedAt,
  busy = false,
  onKeepLocal,
  onUseRemote,
  onCancel,
}: {
  open: boolean
  /** ISO timestamp the cloud snapshot was last written, if known. */
  remoteExportedAt?: string
  busy?: boolean
  onKeepLocal: () => void
  onUseRemote: () => void
  onCancel: () => void
}) {
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>Sync conflict</DialogTitle>
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          This device and the cloud have both changed since the last sync, so they can&#39;t
          be merged automatically. Choose which version to keep — the other is overwritten.
        </p>
        {remoteExportedAt && (
          <p className="text-xs text-muted-foreground">
            Cloud snapshot last written{' '}
            <span className="text-foreground">{new Date(remoteExportedAt).toLocaleString()}</span>.
          </p>
        )}

        <div className="space-y-2 pt-1">
          <Button className="w-full" disabled={busy} onClick={onKeepLocal}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Keep this device — replace cloud'}
          </Button>
          <Button variant="outline" className="w-full" disabled={busy} onClick={onUseRemote}>
            Use cloud — replace this device
          </Button>
          <Button variant="ghost" className="w-full" disabled={busy} onClick={onCancel}>
            Cancel
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          &ldquo;Use cloud&rdquo; erases this device&#39;s local data — including anything not yet
          synced — and replaces it with the cloud copy.
        </p>
      </div>
    </Dialog>
  )
}
