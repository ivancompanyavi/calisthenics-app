import '../../repositories/__tests__/setup'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/db'
import { clearAllTables } from '../../repositories/__tests__/setup'
import { settingsRepository } from '@/repositories'
import { requestSync, retrySyncIfNeeded, syncNow } from '../sync-scheduler'

const SINGLETON_ID = 'singleton' as const

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
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

  it('syncNow always attempts a push regardless of the pending flag', async () => {
    await seedEnabledSync({ pendingSync: false, lastSyncedAt: 999 })
    const fetchMock = vi.mocked(fetch)
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { sha: 'existing' }))
      .mockResolvedValueOnce(jsonResponse(200, { content: { sha: 'newer' } }))

    await syncNow()

    expect(fetchMock).toHaveBeenCalledTimes(2)
    const settings = await settingsRepository.get()
    expect(settings.githubSync?.lastSyncedAt).not.toBe(999)
  })
})
