// Pure GitHub-contents-API client for the one-way training-data mirror. No
// React imports — this module is a plain fetch wrapper so it can be called
// from a scheduler, a hook, or a test with equal ease.
//
// Flow: GET the file to find its current `sha` (404 means "first push, omit
// sha"), then PUT the new content. GitHub's contents API requires the sha of
// the file being replaced to avoid clobbering concurrent writes — since this
// app is single-user/single-device-at-a-time in practice, a conflict here
// almost always means a stale sha from a previous failed attempt, not a real
// collision, but we still surface it distinctly so callers can decide how to
// recover (re-fetch sha and retry).

const API_BASE = 'https://api.github.com'
const DEFAULT_PATH = 'snapshot.json'

export interface GithubSyncConfig {
  token: string
  owner: string
  repo: string
  // Defaults to 'snapshot.json' at the repo root.
  path?: string
}

export type GithubSyncErrorKind = 'auth' | 'network' | 'conflict' | 'unknown'

export class GithubSyncError extends Error {
  readonly kind: GithubSyncErrorKind

  constructor(kind: GithubSyncErrorKind, message: string) {
    super(message)
    this.name = 'GithubSyncError'
    this.kind = kind
  }
}

export interface PushResult {
  // sha of the newly-written blob, when GitHub returns one.
  sha?: string
}

// UTF-8-safe base64 encoding, chunked to stay below the spread/argument-count
// limit for large payloads. The snapshot is JSON (ASCII-safe in practice),
// but we don't assume that — same chunked-btoa pattern as data-transfer.ts's
// blobToBase64, just fed from a string via TextEncoder instead of a Blob.
function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

// UTF-8-safe base64 DECODE, counterpart to utf8ToBase64. GitHub's contents
// API returns `content` as base64 with embedded newlines, so strip whitespace
// before decoding.
function base64ToUtf8(base64: string): string {
  const binary = atob(base64.replace(/\s/g, ''))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
  }
}

function contentsUrl(config: GithubSyncConfig): string {
  const path = config.path ?? DEFAULT_PATH
  return `${API_BASE}/repos/${config.owner}/${config.repo}/contents/${path}`
}

// Resolves the current sha of the snapshot file, or undefined if it doesn't
// exist yet (first push). Throws GithubSyncError for auth failures and wraps
// any other fetch failure as a network error.
export async function getFileSha(config: GithubSyncConfig): Promise<string | undefined> {
  let res: Response
  try {
    res = await fetch(contentsUrl(config), { headers: authHeaders(config.token) })
  } catch (err) {
    throw new GithubSyncError(
      'network',
      err instanceof Error ? err.message : 'Network error while checking for an existing snapshot',
    )
  }

  if (res.status === 404) return undefined
  if (res.status === 401 || res.status === 403) {
    throw new GithubSyncError('auth', `GitHub rejected the token while reading snapshot.json (${res.status})`)
  }
  if (!res.ok) {
    throw new GithubSyncError('unknown', `Unexpected GitHub response while reading snapshot.json (${res.status})`)
  }

  const body = (await res.json()) as { sha?: string }
  return body.sha
}

export interface FetchedSnapshot {
  /** Current git blob sha of snapshot.json — the base for divergence checks. */
  sha: string
  /** Decoded JSON payload (the same string a push would have written). */
  json: string
}

// Reads the full snapshot content AND its sha, or null if the file doesn't
// exist yet. Unlike getFileSha, this decodes the base64 `content` so callers
// can compare / import it. Same auth/network error mapping as getFileSha.
export async function fetchSnapshot(config: GithubSyncConfig): Promise<FetchedSnapshot | null> {
  let res: Response
  try {
    res = await fetch(contentsUrl(config), { headers: authHeaders(config.token) })
  } catch (err) {
    throw new GithubSyncError(
      'network',
      err instanceof Error ? err.message : 'Network error while reading snapshot.json',
    )
  }

  if (res.status === 404) return null
  if (res.status === 401 || res.status === 403) {
    throw new GithubSyncError('auth', `GitHub rejected the token while reading snapshot.json (${res.status})`)
  }
  if (!res.ok) {
    throw new GithubSyncError('unknown', `Unexpected GitHub response while reading snapshot.json (${res.status})`)
  }

  const body = (await res.json()) as { sha?: string; content?: string }
  if (!body.sha || typeof body.content !== 'string') {
    throw new GithubSyncError('unknown', 'GitHub returned snapshot.json without a sha/content')
  }
  return { sha: body.sha, json: base64ToUtf8(body.content) }
}

// Pushes a full snapshot to the configured repo/path. `message` should be a
// short commit message (caller supplies it, e.g. "sync: 2026-07-05T18:30
// (workout)") — this module doesn't know why the caller is syncing.
export async function pushSnapshot(
  config: GithubSyncConfig,
  json: string,
  message: string,
  // When the caller already knows the current remote sha (e.g. it just fetched
  // it to decide whether to push), pass it here to skip a redundant GET.
  // `knownSha: null` means "the file doesn't exist yet" (first push, omit sha);
  // omitting the option entirely falls back to fetching the sha ourselves.
  opts?: { knownSha: string | null },
): Promise<PushResult> {
  const sha = opts ? (opts.knownSha ?? undefined) : await getFileSha(config)

  let res: Response
  try {
    res = await fetch(contentsUrl(config), {
      method: 'PUT',
      headers: {
        ...authHeaders(config.token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        content: utf8ToBase64(json),
        ...(sha ? { sha } : {}),
      }),
    })
  } catch (err) {
    throw new GithubSyncError(
      'network',
      err instanceof Error ? err.message : 'Network error while pushing snapshot.json',
    )
  }

  if (res.status === 401 || res.status === 403) {
    throw new GithubSyncError('auth', `GitHub rejected the token while writing snapshot.json (${res.status})`)
  }
  if (res.status === 409) {
    throw new GithubSyncError('conflict', 'snapshot.json changed on GitHub since the last read (sha conflict)')
  }
  if (!res.ok) {
    throw new GithubSyncError('unknown', `Unexpected GitHub response while writing snapshot.json (${res.status})`)
  }

  const body = (await res.json()) as { content?: { sha?: string } }
  return { sha: body.content?.sha }
}
