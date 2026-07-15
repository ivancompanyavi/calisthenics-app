import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import {
  syncNow,
  resolveConflictKeepLocal,
  resolveConflictUseRemote,
  type SyncNowResult,
} from '@/lib/sync-scheduler'
import { showToast } from '@/lib/toast'

type Conflict = { sha: string; json: string; exportedAt?: string }

// Shared "Sync now" + conflict-resolution behaviour, used by both the Settings
// card and the app-wide attention banner. Owns the transient UI state (busy
// flags, the pending conflict) and the query invalidation that a wholesale
// pull/replace requires. Both call sites render the same SyncConflictDialog
// against the `conflict`/`resolving` state this returns.
export function useSyncResolution() {
  const qc = useQueryClient()
  const [syncingNow, setSyncingNow] = useState(false)
  const [conflict, setConflict] = useState<Conflict | null>(null)
  const [resolving, setResolving] = useState(false)

  const applySyncResult = (res: SyncNowResult) => {
    switch (res.status) {
      case 'in-sync':
        showToast('Already up to date', 'success')
        break
      case 'pushed':
        showToast('Synced to cloud', 'success')
        break
      case 'pulled':
        showToast('Updated from cloud', 'success')
        // Local data was replaced wholesale — refresh every query.
        qc.invalidateQueries()
        break
      case 'conflict':
        setConflict(res.remote)
        break
      case 'error':
        showToast(`Sync failed: ${res.message}`, 'error')
        break
      case 'disabled':
        break
    }
  }

  const handleSyncNow = async () => {
    setSyncingNow(true)
    try {
      applySyncResult(await syncNow())
    } finally {
      setSyncingNow(false)
      qc.invalidateQueries({ queryKey: queryKeys.settings })
    }
  }

  const handleKeepLocal = async () => {
    setResolving(true)
    try {
      const res = await resolveConflictKeepLocal()
      if (res.status === 'error') showToast(`Sync failed: ${res.message}`, 'error')
      else showToast('Cloud replaced with this device', 'success')
    } finally {
      setResolving(false)
      setConflict(null)
      qc.invalidateQueries({ queryKey: queryKeys.settings })
    }
  }

  const handleUseRemote = async () => {
    if (!conflict) return
    setResolving(true)
    try {
      const res = await resolveConflictUseRemote({ sha: conflict.sha, json: conflict.json })
      if (res.status === 'error') showToast(`Sync failed: ${res.message}`, 'error')
      else showToast('This device replaced with cloud data', 'success')
    } finally {
      setResolving(false)
      setConflict(null)
      // Local data was replaced wholesale — refresh every query.
      qc.invalidateQueries()
    }
  }

  return {
    syncingNow,
    conflict,
    resolving,
    setConflict,
    handleSyncNow,
    handleKeepLocal,
    handleUseRemote,
  }
}
