import '../../repositories/__tests__/setup'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/db'
import { clearAllTables } from '../../repositories/__tests__/setup'
import { settingsRepository } from '@/repositories'
import {
  requestSync,
  retrySyncIfNeeded,
  syncNow,
  decideSyncAction,
  resolveConflictKeepLocal,
  resolveConflictUseRemote,
  onSyncStatusChange,
} from '../sync-scheduler'
import { exportForSync } from '../data-transfer'
import { toastListeners, type Toast } from '../toast'

const SINGLETON_ID = 'singleton' as const

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// Mimics GitHub's contents API GET response, which base64-encodes the file
// content alongside its sha.
function contentResponse(status: number, sha: string, json: string): Response {
  return jsonResponse(status, { sha, content: btoa(json) })
}

async function seedEnabledSync(overrides: Partial<NonNullable<import('@/models/types').Settings['githubSync']>> = {}) {
  await db.settings.put({
    id: SINGLETON_ID,
    weightUnit: 'lb',
    githubSync: {
      token: 'test-token',
      owner: 'ivancompanyavi',
      repo: 'calisthenics-data',
      enabled: true,
      ...overrides,
    },
  })
}

describe('sync-scheduler dirty-flag behavior', () => {
  beforeEach(async () => {
    await clearAllTables()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('is a no-op when sync is disabled', async () => {
    await seedEnabledSync({ enabled: false })
    const fetchMock = vi.mocked(fetch)

    await requestSync('workout')

    expect(fetchMock).not.toHaveBeenCalled()
    const settings = await settingsRepository.get()
    expect(settings.githubSync?.pendingSync).toBeFalsy()
  })

  it('is a no-op when unconfigured (no token)', async () => {
    await seedEnabledSync({ token: '' })
    const fetchMock = vi.mocked(fetch)

    await requestSync('workout')

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('successful push clears pendingSync and sets lastSyncedAt', async () => {
    await seedEnabledSync()
    const fetchMock = vi.mocked(fetch)
    fetchMock
      .mockResolvedValueOnce(jsonResponse(404, {})) // GET: no file yet
      .mockResolvedValueOnce(jsonResponse(201, { content: { sha: 'abc' } })) // PUT succeeds

    await requestSync('workout')

    const settings = await settingsRepository.get()
    expect(settings.githubSync?.pendingSync).toBe(false)
    expect(settings.githubSync?.lastSyncedAt).toEqual(expect.any(Number))
    expect(settings.githubSync?.lastError).toBeUndefined()
  })

  it('failed push leaves pendingSync true and records the error', async () => {
    await seedEnabledSync()
    const fetchMock = vi.mocked(fetch)
    fetchMock
      .mockResolvedValueOnce(jsonResponse(404, {})) // GET: no file yet
      .mockResolvedValueOnce(jsonResponse(401, { message: 'Bad credentials' })) // PUT auth failure

    await requestSync('workout')

    const settings = await settingsRepository.get()
    expect(settings.githubSync?.pendingSync).toBe(true)
    expect(settings.githubSync?.lastSyncedAt).toBeUndefined()
    expect(settings.githubSync?.lastError).toBeTruthy()
  })

  it('never throws even when the network call rejects outright', async () => {
    await seedEnabledSync()
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    await expect(requestSync('workout')).resolves.toBeUndefined()
    const settings = await settingsRepository.get()
    expect(settings.githubSync?.pendingSync).toBe(true)
  })

  it('retrySyncIfNeeded is a no-op when nothing is pending', async () => {
    await seedEnabledSync({ pendingSync: false, lastSyncedAt: 12345 })
    const fetchMock = vi.mocked(fetch)

    retrySyncIfNeeded()
    // retrySyncIfNeeded is fire-and-forget; flush microtasks.
    await Promise.resolve()
    await Promise.resolve()

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('retrySyncIfNeeded pushes when a prior attempt left pendingSync true', async () => {
    await seedEnabledSync({ pendingSync: true })
    const fetchMock = vi.mocked(fetch)
    fetchMock
      .mockResolvedValueOnce(jsonResponse(404, {}))
      .mockResolvedValueOnce(jsonResponse(201, { content: { sha: 'abc' } }))

    retrySyncIfNeeded()
    // Wait for the fire-and-forget chain (settingsRepository.get -> attemptSync -> ...) to settle.
    await vi.waitFor(async () => {
      const settings = await settingsRepository.get()
      expect(settings.githubSync?.pendingSync).toBe(false)
    })
  })

  it('a request that arrives mid-flight triggers a second push after the first lands', async () => {
    await seedEnabledSync()
    const fetchMock = vi.mocked(fetch)

    // Gate the first PUT so we can inject a second request while it's in flight.
    let releaseFirstPut!: (r: Response) => void
    const firstPutGate = new Promise<Response>((resolve) => {
      releaseFirstPut = resolve
    })
    fetchMock
      .mockResolvedValueOnce(jsonResponse(404, {})) // push 1 GET: no file yet
      .mockReturnValueOnce(firstPutGate) // push 1 PUT: held open
      .mockResolvedValueOnce(jsonResponse(200, { sha: 'abc' })) // push 2 GET
      .mockResolvedValueOnce(jsonResponse(200, { content: { sha: 'def' } })) // push 2 PUT

    const first = requestSync('workout')
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))

    // New data lands while push 1 is still in flight — its snapshot predates
    // this, so a rerun is owed once the flight completes.
    const second = requestSync('bodyweight')
    releaseFirstPut(jsonResponse(201, { content: { sha: 'abc' } }))
    await Promise.all([first, second])

    await vi.waitFor(async () => {
      expect(fetchMock).toHaveBeenCalledTimes(4)
      const settings = await settingsRepository.get()
      expect(settings.githubSync?.pendingSync).toBe(false)
    })
  })

  it('automatic sync backs off (needsAttention) instead of clobbering a diverged remote', async () => {
    await seedEnabledSync({ pendingSync: true, lastSyncedSha: 'base' })
    const fetchMock = vi.mocked(fetch)
    // getFileSha sees a sha that differs from our base → remote moved.
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { sha: 'moved' }))

    await requestSync('workout')

    // Only the GET happened — no PUT, so the diverged remote is untouched.
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const settings = await settingsRepository.get()
    expect(settings.githubSync?.needsAttention).toBe(true)
    expect(settings.githubSync?.pendingSync).toBe(true)
  })

  it('toasts once on the transition into needsAttention, not on repeat back-offs', async () => {
    const toasts: Toast[] = []
    const listener = (t: Toast) => toasts.push(t)
    toastListeners.add(listener)
    try {
      await seedEnabledSync({ pendingSync: true, lastSyncedSha: 'base' })
      const fetchMock = vi.mocked(fetch)
      // Remote is diverged on both attempts.
      fetchMock.mockResolvedValue(jsonResponse(200, { sha: 'moved' }))

      await requestSync('workout')
      // A second save while still flagged must not re-toast.
      await requestSync('bodyweight')

      const errorToasts = toasts.filter((t) => t.type === 'error')
      expect(errorToasts).toHaveLength(1)
      expect(errorToasts[0].message).toMatch(/Sync paused/)
    } finally {
      toastListeners.delete(listener)
    }
  })

  it('notifies status-change subscribers when it flips a flag', async () => {
    const notify = vi.fn()
    const unsubscribe = onSyncStatusChange(notify)
    try {
      await seedEnabledSync({ pendingSync: true, lastSyncedSha: 'base' })
      const fetchMock = vi.mocked(fetch)
      fetchMock.mockResolvedValueOnce(jsonResponse(200, { sha: 'moved' }))

      await requestSync('workout')

      expect(notify).toHaveBeenCalled()
    } finally {
      unsubscribe()
    }
  })
})

describe('decideSyncAction', () => {
  it('pushes when there is no remote file yet', () => {
    expect(decideSyncAction({ remoteExists: false, localDirty: true })).toBe('push')
    expect(decideSyncAction({ remoteExists: false, localDirty: false })).toBe('push')
  })

  it('is a noop when remote is unchanged and local is clean', () => {
    expect(decideSyncAction({ remoteExists: true, remoteSha: 'a', baseSha: 'a', localDirty: false })).toBe('noop')
  })

  it('fast-forward pushes when remote is unchanged and local is dirty', () => {
    expect(decideSyncAction({ remoteExists: true, remoteSha: 'a', baseSha: 'a', localDirty: true })).toBe('push')
  })

  it('fast-forward pulls when remote moved and local is clean', () => {
    expect(decideSyncAction({ remoteExists: true, remoteSha: 'b', baseSha: 'a', localDirty: false })).toBe('pull')
  })

  it('conflicts when both remote and local moved', () => {
    expect(decideSyncAction({ remoteExists: true, remoteSha: 'b', baseSha: 'a', localDirty: true })).toBe('conflict')
  })

  it('treats a missing base sha (never synced) as remote-moved', () => {
    expect(decideSyncAction({ remoteExists: true, remoteSha: 'b', baseSha: undefined, localDirty: false })).toBe('pull')
    expect(decideSyncAction({ remoteExists: true, remoteSha: 'b', baseSha: undefined, localDirty: true })).toBe('conflict')
  })
})

describe('syncNow (manual, interactive)', () => {
  beforeEach(async () => {
    await clearAllTables()
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => vi.unstubAllGlobals())

  it('pushes and records the new sha when there is no remote file', async () => {
    await seedEnabledSync({ pendingSync: true })
    const fetchMock = vi.mocked(fetch)
    fetchMock
      .mockResolvedValueOnce(jsonResponse(404, {})) // fetchSnapshot: no file
      .mockResolvedValueOnce(jsonResponse(201, { content: { sha: 'xyz' } })) // PUT

    const res = await syncNow()

    expect(res.status).toBe('pushed')
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const settings = await settingsRepository.get()
    expect(settings.githubSync?.lastSyncedSha).toBe('xyz')
    expect(settings.githubSync?.pendingSync).toBe(false)
  })

  it('reports in-sync (no push) when remote matches base and local is clean', async () => {
    await seedEnabledSync({ pendingSync: false, lastSyncedSha: 'abc' })
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(contentResponse(200, 'abc', '{}'))

    const res = await syncNow()

    expect(res.status).toBe('in-sync')
    expect(fetchMock).toHaveBeenCalledTimes(1) // GET only, no PUT
    const settings = await settingsRepository.get()
    expect(settings.githubSync?.lastSyncedSha).toBe('abc')
  })

  it('fast-forward pushes when remote matches base and local is dirty', async () => {
    await seedEnabledSync({ pendingSync: true, lastSyncedSha: 'abc' })
    const fetchMock = vi.mocked(fetch)
    fetchMock
      .mockResolvedValueOnce(contentResponse(200, 'abc', '{}')) // fetchSnapshot
      .mockResolvedValueOnce(jsonResponse(200, { content: { sha: 'def' } })) // PUT

    const res = await syncNow()

    expect(res.status).toBe('pushed')
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const settings = await settingsRepository.get()
    expect(settings.githubSync?.lastSyncedSha).toBe('def')
  })

  it('returns a conflict (no write) when both sides diverged', async () => {
    await seedEnabledSync({ pendingSync: true, lastSyncedSha: 'old' })
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(
      contentResponse(200, 'new', '{"exportedAt":"2026-07-01T00:00:00.000Z"}'),
    )

    const res = await syncNow()

    expect(res.status).toBe('conflict')
    if (res.status === 'conflict') {
      expect(res.remote.sha).toBe('new')
      expect(res.remote.exportedAt).toBe('2026-07-01T00:00:00.000Z')
    }
    expect(fetchMock).toHaveBeenCalledTimes(1) // GET only, nothing overwritten
    const settings = await settingsRepository.get()
    expect(settings.githubSync?.lastSyncedSha).toBe('old') // base untouched
    expect(settings.githubSync?.pendingSync).toBe(true)
  })

  it('pulls (imports remote) when remote moved and local is clean', async () => {
    await seedEnabledSync({ pendingSync: false, lastSyncedSha: 'base' })
    const validSnapshot = await exportForSync() // valid empty snapshot from this DB
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(contentResponse(200, 'ahead', validSnapshot))

    const res = await syncNow()

    expect(res.status).toBe('pulled')
    expect(fetchMock).toHaveBeenCalledTimes(1) // GET only; import is local
    const settings = await settingsRepository.get()
    expect(settings.githubSync?.lastSyncedSha).toBe('ahead')
    expect(settings.githubSync?.pendingSync).toBe(false)
  })
})

describe('conflict resolution', () => {
  beforeEach(async () => {
    await clearAllTables()
    vi.stubGlobal('fetch', vi.fn())
  })
  afterEach(() => vi.unstubAllGlobals())

  it('resolveConflictKeepLocal overwrites the remote with local data', async () => {
    await seedEnabledSync({ pendingSync: true, lastSyncedSha: 'old', needsAttention: true })
    const fetchMock = vi.mocked(fetch)
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { sha: 'new' })) // getFileSha for the overwrite
      .mockResolvedValueOnce(jsonResponse(200, { content: { sha: 'newer' } })) // PUT

    const res = await resolveConflictKeepLocal()

    expect(res.status).toBe('pushed')
    const settings = await settingsRepository.get()
    expect(settings.githubSync?.lastSyncedSha).toBe('newer')
    expect(settings.githubSync?.pendingSync).toBe(false)
    expect(settings.githubSync?.needsAttention).toBe(false)
  })

  it('resolveConflictUseRemote imports the supplied snapshot without any network write', async () => {
    await seedEnabledSync({ pendingSync: true, lastSyncedSha: 'old', needsAttention: true })
    const validSnapshot = await exportForSync()
    const fetchMock = vi.mocked(fetch)

    const res = await resolveConflictUseRemote({ sha: 'chosen', json: validSnapshot })

    expect(res.status).toBe('pulled')
    expect(fetchMock).not.toHaveBeenCalled()
    const settings = await settingsRepository.get()
    expect(settings.githubSync?.lastSyncedSha).toBe('chosen')
    expect(settings.githubSync?.needsAttention).toBe(false)
  })
})
