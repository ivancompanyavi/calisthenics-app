import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GithubSyncError, pushSnapshot } from '../github-sync'

const config = { token: 'test-token', owner: 'ivancompanyavi', repo: 'calisthenics-data' }

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('github-sync', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('first push: GET 404s (no file yet), PUT omits sha', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock
      .mockResolvedValueOnce(jsonResponse(404, { message: 'Not Found' }))
      .mockResolvedValueOnce(jsonResponse(201, { content: { sha: 'new-sha' } }))

    const result = await pushSnapshot(config, '{"a":1}', 'sync: test (first push)')

    expect(result.sha).toBe('new-sha')
    expect(fetchMock).toHaveBeenCalledTimes(2)

    const [getUrl, getInit] = fetchMock.mock.calls[0]
    expect(getUrl).toBe('https://api.github.com/repos/ivancompanyavi/calisthenics-data/contents/snapshot.json')
    expect((getInit as RequestInit).headers).toMatchObject({ Authorization: 'Bearer test-token' })

    const [putUrl, putInit] = fetchMock.mock.calls[1]
    expect(putUrl).toBe(getUrl)
    expect((putInit as RequestInit).method).toBe('PUT')
    const putBody = JSON.parse((putInit as RequestInit).body as string)
    expect(putBody.sha).toBeUndefined()
    expect(putBody.message).toBe('sync: test (first push)')
    expect(putBody.content).toBe(btoa('{"a":1}'))
  })

  it('sha-update path: GET returns an existing sha, PUT includes it', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { sha: 'existing-sha' }))
      .mockResolvedValueOnce(jsonResponse(200, { content: { sha: 'updated-sha' } }))

    const result = await pushSnapshot(config, '{"a":2}', 'sync: test (update)')

    expect(result.sha).toBe('updated-sha')
    const [, putInit] = fetchMock.mock.calls[1]
    const putBody = JSON.parse((putInit as RequestInit).body as string)
    expect(putBody.sha).toBe('existing-sha')
  })

  it('auth-failure path on the GET: throws a GithubSyncError with kind "auth"', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(jsonResponse(401, { message: 'Bad credentials' }))

    await expect(pushSnapshot(config, '{}', 'sync: test')).rejects.toMatchObject({
      name: 'GithubSyncError',
      kind: 'auth',
    })
    expect(fetchMock).toHaveBeenCalledTimes(1) // never reaches the PUT
  })

  it('auth-failure path on the PUT: throws a GithubSyncError with kind "auth"', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock
      .mockResolvedValueOnce(jsonResponse(404, {}))
      .mockResolvedValueOnce(jsonResponse(403, { message: 'Forbidden' }))

    await expect(pushSnapshot(config, '{}', 'sync: test')).rejects.toMatchObject({
      name: 'GithubSyncError',
      kind: 'auth',
    })
  })

  it('conflict path: PUT 409s, throws a GithubSyncError with kind "conflict"', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { sha: 'stale-sha' }))
      .mockResolvedValueOnce(jsonResponse(409, { message: 'Conflict' }))

    await expect(pushSnapshot(config, '{}', 'sync: test')).rejects.toMatchObject({
      name: 'GithubSyncError',
      kind: 'conflict',
    })
  })

  it('network failure: fetch rejecting throws a GithubSyncError with kind "network"', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    const error = await pushSnapshot(config, '{}', 'sync: test').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(GithubSyncError)
    expect(error).toMatchObject({ kind: 'network' })
  })
})
