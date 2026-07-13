// Coordinates the GitHub coach-sync mirror. Two distinct paths:
//
//   • Automatic (requestSync / retrySyncIfNeeded): fire-and-forget, runs after
//     every workout/bodyweight/nutrition save, on app start, and on `online`.
//     It only ever *pushes*, and only when it's a safe fast-forward — i.e. the
//     remote hasn't changed since this device last synced. If the remote HAS
//     diverged, it backs off (sets needsAttention) rather than clobbering the
//     other device. It never prompts (there may be no user watching).
//
//   • Manual (syncNow, called by the Settings "Sync now" button): fetches the
//     remote snapshot, compares against our base sha, and returns a result the
//     UI acts on. On true divergence (both sides changed) it returns
//     'conflict' with the remote payload so the UI can offer the 3-way choice;
//     resolveConflictKeepLocal / resolveConflictUseRemote finish the job.
//
// Divergence is detected with `lastSyncedSha` (the sha we last synced with) vs
// the current remote sha — a git-style base comparison, not a timestamp.
//
// Because every push is a full snapshot (see exportForSync), there's no event
// queue to replay after an offline stretch — "sync needed" collapses to a
// single dirty flag (pendingSync).
//
// No React imports on purpose: this runs from main.tsx before the React tree
// exists, and from mutation onSuccess callbacks after it does.

import { settingsRepository } from '@/repositories'
import { exportForSync, importAllData } from '@/lib/data-transfer'
import {
  pushSnapshot,
  getFileSha,
  fetchSnapshot,
  GithubSyncError,
  type GithubSyncConfig,
  type GithubSyncErrorKind,
} from '@/lib/github-sync'
import { showToast } from '@/lib/toast'
import type { Settings } from '@/models/types'

type GithubSyncSettings = NonNullable<Settings['githubSync']>

function isConfigured(settings: Settings | undefined): settings is Settings & { githubSync: GithubSyncSettings } {
  const gs = settings?.githubSync
  return !!gs && gs.enabled && gs.token.length > 0 && gs.owner.length > 0 && gs.repo.length > 0
}

function configOf(gs: GithubSyncSettings): GithubSyncConfig {
  return { token: gs.token, owner: gs.owner, repo: gs.repo }
}

function formatCommitMessage(reason: string): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
  return `sync: ${stamp} (${reason})`
}

// ───────────────── Divergence decision (pure) ─────────────────

export type SyncAction = 'noop' | 'push' | 'pull' | 'conflict'

// Given the remote/base/local state, decide what a sync should do:
//   • no remote file            → push (first upload)
//   • remote unchanged, dirty   → push (fast-forward)
//   • remote unchanged, clean   → noop (already in sync)
//   • remote moved, clean       → pull (fast-forward from cloud)
//   • remote moved, dirty       → conflict (both sides changed) → needs a human
//
// "remote moved" means the current remote sha differs from the base sha this
// device last synced with. A missing base (never synced) counts as moved.
export function decideSyncAction(input: {
  remoteExists: boolean
  remoteSha?: string
  baseSha?: string
  localDirty: boolean
}): SyncAction {
  const { remoteExists, remoteSha, baseSha, localDirty } = input
  if (!remoteExists) return 'push'
  const remoteChanged = remoteSha !== baseSha
  if (!remoteChanged) return localDirty ? 'push' : 'noop'
  return localDirty ? 'conflict' : 'pull'
}

// ───────────────── Shared settings mutations ─────────────────

// Re-reads settings before patching githubSync so a concurrent connection edit
// (token/owner/repo change while a request was in flight) isn't stomped.
async function patchSync(patch: Partial<GithubSyncSettings>): Promise<void> {
  const latest = await settingsRepository.get()
  if (latest.githubSync) {
    await settingsRepository.update({ githubSync: { ...latest.githubSync, ...patch } })
  }
}

async function markPushed(sha: string | undefined): Promise<void> {
  await patchSync({
    pendingSync: false,
    needsAttention: false,
    lastSyncedAt: Date.now(),
    lastSyncedSha: sha,
    lastError: undefined,
  })
}

// Sets the dirty flag if it isn't already. Used before firing an owed rerun:
// the just-finished push exported its snapshot BEFORE the newer data landed,
// so the rerun must see pendingSync=true or its fast-forward check no-ops.
async function markDirty(): Promise<void> {
  const latest = await settingsRepository.get()
  if (latest.githubSync && !latest.githubSync.pendingSync) {
    await settingsRepository.update({ githubSync: { ...latest.githubSync, pendingSync: true } })
  }
}

// ───────────────── Automatic push (fast-forward only) ─────────────────

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
  const config = configOf(settings.githubSync)

  try {
    const remoteSha = await getFileSha(config)
    const action = decideSyncAction({
      remoteExists: remoteSha !== undefined,
      remoteSha,
      baseSha: settings.githubSync.lastSyncedSha,
      localDirty: settings.githubSync.pendingSync ?? false,
    })

    if (action === 'conflict' || action === 'pull') {
      // The remote diverged from our base. Automatic sync never overwrites and
      // never auto-imports — flag it so the next manual sync resolves it.
      await patchSync({ pendingSync: true, needsAttention: true })
      return
    }

    if (action === 'noop') {
      await patchSync({ pendingSync: false, needsAttention: false, lastSyncedAt: Date.now(), lastError: undefined })
      return
    }

    // action === 'push' — safe fast-forward (or first upload).
    const json = await exportForSync()
    const result = await pushSnapshot(config, json, formatCommitMessage(reason), { knownSha: remoteSha ?? null })
    await markPushed(result.sha)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown sync error'
    await patchSync({ pendingSync: true, lastError: message })
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
      // The just-finished push exported its snapshot before this rerun's data
      // existed, so re-mark dirty first (else the rerun's fast-forward check
      // sees a clean state and no-ops), THEN push again. Deliberately not
      // awaited/returned — a fresh fire-and-forget, like the original caller.
      void markDirty().then(() => attemptSync(rerunReason))
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

// ───────────────── Manual sync (interactive) ─────────────────

export type SyncNowResult =
  | { status: 'disabled' }
  | { status: 'in-sync' }
  | { status: 'pushed' }
  | { status: 'pulled' }
  | { status: 'conflict'; remote: { sha: string; json: string; exportedAt?: string } }
  | { status: 'error'; message: string; kind?: GithubSyncErrorKind }

function readExportedAt(json: string): string | undefined {
  try {
    const parsed = JSON.parse(json) as { exportedAt?: unknown }
    return typeof parsed.exportedAt === 'string' ? parsed.exportedAt : undefined
  } catch {
    return undefined
  }
}

function toError(err: unknown): SyncNowResult {
  const message = err instanceof Error ? err.message : 'Unknown sync error'
  return { status: 'error', message, kind: err instanceof GithubSyncError ? err.kind : undefined }
}

async function pushLocal(config: GithubSyncConfig, knownSha?: string | null): Promise<SyncNowResult> {
  const json = await exportForSync()
  const result = await pushSnapshot(
    config,
    json,
    formatCommitMessage('manual'),
    knownSha === undefined ? undefined : { knownSha },
  )
  await markPushed(result.sha)
  return { status: 'pushed' }
}

async function applyRemote(remote: { sha: string; json: string }): Promise<SyncNowResult> {
  await importAllData(remote.json)
  await markPushed(remote.sha)
  return { status: 'pulled' }
}

// Explicit "Sync now" button in Settings. Fetches the remote, compares against
// our base, and either resolves automatically (noop/push/pull) or returns a
// 'conflict' the UI must resolve. Unlike the automatic path, this reports
// errors back to the caller instead of swallowing them.
export async function syncNow(): Promise<SyncNowResult> {
  // Let any in-flight automatic push settle first so we compare against a
  // stable remote and don't race two writers from this same device.
  if (inFlight) {
    try {
      await inFlight
    } catch {
      // ignore — we re-evaluate from scratch below
    }
  }

  const settings = await settingsRepository.get()
  if (!isConfigured(settings)) return { status: 'disabled' }
  const gs = settings.githubSync
  const config = configOf(gs)

  try {
    const remote = await fetchSnapshot(config)
    const action = decideSyncAction({
      remoteExists: remote !== null,
      remoteSha: remote?.sha,
      baseSha: gs.lastSyncedSha,
      localDirty: gs.pendingSync ?? false,
    })

    switch (action) {
      case 'noop':
        await patchSync({
          pendingSync: false,
          needsAttention: false,
          lastSyncedAt: Date.now(),
          lastSyncedSha: remote?.sha,
          lastError: undefined,
        })
        return { status: 'in-sync' }
      case 'push':
        return await pushLocal(config, remote?.sha ?? null)
      case 'pull':
        return await applyRemote(remote!)
      case 'conflict':
        return {
          status: 'conflict',
          remote: { sha: remote!.sha, json: remote!.json, exportedAt: readExportedAt(remote!.json) },
        }
    }
  } catch (err) {
    await patchSync({ pendingSync: true, lastError: err instanceof Error ? err.message : 'Unknown sync error' })
    return toError(err)
  }
}

// Conflict resolution — "keep this device's data, replace the cloud". Fetches
// the current sha so the overwrite PUT is accepted, then pushes local wholesale.
export async function resolveConflictKeepLocal(): Promise<SyncNowResult> {
  const settings = await settingsRepository.get()
  if (!isConfigured(settings)) return { status: 'disabled' }
  const config = configOf(settings.githubSync)
  try {
    // Fetch a fresh sha (undefined lets pushSnapshot fetch it) so we overwrite
    // whatever is currently there.
    return await pushLocal(config)
  } catch (err) {
    await patchSync({ pendingSync: true, lastError: err instanceof Error ? err.message : 'Unknown sync error' })
    return toError(err)
  }
}

// Conflict resolution — "use the cloud data, replace this device". Destructive
// full import of the snapshot the user was shown in the conflict dialog.
export async function resolveConflictUseRemote(remote: { sha: string; json: string }): Promise<SyncNowResult> {
  const settings = await settingsRepository.get()
  if (!isConfigured(settings)) return { status: 'disabled' }
  try {
    return await applyRemote(remote)
  } catch (err) {
    await patchSync({ lastError: err instanceof Error ? err.message : 'Unknown sync error' })
    return toError(err)
  }
}
