// Coordinates the GitHub coach-sync mirror: decides *whether* to push (is
// sync configured/enabled?), builds the snapshot, calls github-sync's
// pushSnapshot, and maintains the pendingSync/lastSyncedAt/lastError fields
// on the Settings singleton.
//
// Because every push is a full snapshot (see exportForSync), there's no
// event queue to replay after an offline stretch — "sync needed" collapses
// to a single dirty flag. Callers (hooks, app-start, the `online` event)
// just call requestSync()/retrySyncIfNeeded(); this module figures out
// whether a push actually happens.
//
// No React imports on purpose: this runs from main.tsx before the React tree
// exists, and from mutation onSuccess callbacks after it does.

import { settingsRepository } from '@/repositories'
import { exportForSync } from '@/lib/data-transfer'
import { pushSnapshot, GithubSyncError } from '@/lib/github-sync'
import { showToast } from '@/lib/toast'
import type { Settings } from '@/models/types'

type GithubSyncSettings = NonNullable<Settings['githubSync']>

function isConfigured(settings: Settings | undefined): settings is Settings & { githubSync: GithubSyncSettings } {
  const gs = settings?.githubSync
  return !!gs && gs.enabled && gs.token.length > 0 && gs.owner.length > 0 && gs.repo.length > 0
}

function formatCommitMessage(reason: string): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
  return `sync: ${stamp} (${reason})`
}

// De-dupes overlapping calls (e.g. app-start and an `online` event firing
// close together) so we don't push twice in a race. A request that arrives
// while a push is already in flight can't just piggyback on that promise —
// the in-flight push exported its snapshot BEFORE the new data existed, so
// we remember that a rerun is owed and push once more when the flight lands.
let inFlight: Promise<void> | null = null
let rerunOwed = false
let rerunReason = 'retry'

async function runSync(reason: string): Promise<void> {
  const settings = await settingsRepository.get()
  if (!isConfigured(settings)) return
  const gs = settings.githubSync

  try {
    const json = await exportForSync()
    await pushSnapshot(
      { token: gs.token, owner: gs.owner, repo: gs.repo },
      json,
      formatCommitMessage(reason),
    )
    // Re-read instead of writing back the pre-push `gs` — the user may have
    // edited the connection (token/owner/repo) while the request was in
    // flight, and a stale spread would silently revert that edit.
    const latest = await settingsRepository.get()
    if (latest.githubSync) {
      await settingsRepository.update({
        githubSync: { ...latest.githubSync, pendingSync: false, lastSyncedAt: Date.now(), lastError: undefined },
      })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown sync error'
    // Re-read in case something else updated settings while the push was in
    // flight (e.g. the user disabled sync mid-request).
    const latest = await settingsRepository.get()
    if (latest.githubSync) {
      await settingsRepository.update({
        githubSync: { ...latest.githubSync, pendingSync: true, lastError: message },
      })
    }
    if (err instanceof GithubSyncError) {
      showToast(`Coach sync failed: ${message}`, 'error')
    }
    // Swallow — sync failures must never surface as a rejected promise to a
    // fire-and-forget caller (workout/bodyweight saving must never break).
  }
}

function attemptSync(reason: string): Promise<void> {
  if (inFlight) {
    rerunOwed = true
    rerunReason = reason
    return inFlight
  }
  inFlight = runSync(reason).finally(() => {
    inFlight = null
    if (rerunOwed) {
      rerunOwed = false
      // Deliberately not awaited/returned: the original caller's promise
      // resolves with its own push; the rerun is a fresh fire-and-forget.
      void attemptSync(rerunReason)
    }
  })
  return inFlight
}

// Marks the dirty flag (so a later retry knows a push is owed even if this
// attempt fails or the app closes mid-request) and immediately attempts a
// push. Fire-and-forget from the caller's perspective — never throws.
export async function requestSync(reason: string): Promise<void> {
  try {
    const settings = await settingsRepository.get()
    if (!isConfigured(settings)) return
    if (!settings.githubSync.pendingSync) {
      await settingsRepository.update({
        githubSync: { ...settings.githubSync, pendingSync: true },
      })
    }
    await attemptSync(reason)
  } catch {
    // Never propagate — see module doc.
  }
}

// App-start / `online`-event retry: no-op when sync is disabled/unconfigured
// or when there's nothing pending, otherwise attempts a push.
export function retrySyncIfNeeded(): void {
  settingsRepository
    .get()
    .then((settings) => {
      if (!isConfigured(settings)) return
      if (!settings.githubSync.pendingSync) return
      return attemptSync('retry')
    })
    .catch(() => {
      // Never propagate.
    })
}

// Explicit "Sync now" button in Settings. Same never-throws contract as
// requestSync, but always attempts a push regardless of the pending flag —
// the user is asking for it right now. Still a no-op when sync isn't
// enabled/configured (the button is only shown/enabled once it is).
export async function syncNow(): Promise<void> {
  await attemptSync('manual')
}
