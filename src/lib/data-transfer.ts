import { db } from '@/db'
import type {
  ActiveProgram,
  BlockEntry,
  BodyweightLog,
  Goal,
  Movement,
  Program,
  ProgramDay,
  Progression,
  ProgressionLevel,
  SetLog,
  Skill,
  Workout,
  WorkoutBlock,
  WorkoutLog,
} from '@/models/types'

const EXPORT_VERSION = 5
// v5 adds skills. Older v2/v3/v4 files import cleanly because skills is
// treated as optional (defaults to [] when absent).
const SUPPORTED_IMPORT_VERSIONS = [2, 3, 4, 5]

// ───────────────── Photo encoding ─────────────────

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer()
  // Chunk to stay below the spread-argument limit in larger photos.
  const bytes = new Uint8Array(buf)
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

function base64ToBlob(base64: string, type: string): Blob {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type })
}

// ───────────────── Export ─────────────────

// Shared table fetch used by both the full export and the sync-only export.
async function queryAllTables() {
  const [
    movements,
    progressions,
    progressionLevels,
    workouts,
    workoutBlocks,
    blockEntries,
    workoutLogs,
    setLogs,
    programs,
    programDays,
    activePrograms,
    bodyweightLogs,
    goals,
    skills,
  ] = await Promise.all([
    db.movements.toArray(),
    db.progressions.toArray(),
    db.progressionLevels.toArray(),
    db.workouts.toArray(),
    db.workoutBlocks.toArray(),
    db.blockEntries.toArray(),
    db.workoutLogs.toArray(),
    db.setLogs.toArray(),
    db.programs.toArray(),
    db.programDays.toArray(),
    db.activePrograms.toArray(),
    db.bodyweightLogs.toArray(),
    db.goals.toArray(),
    db.skills.toArray(),
  ])
  return {
    movements,
    progressions,
    progressionLevels,
    workouts,
    workoutBlocks,
    blockEntries,
    workoutLogs,
    setLogs,
    programs,
    programDays,
    activePrograms,
    bodyweightLogs,
    goals,
    skills,
  }
}

export async function exportAllData(): Promise<string> {
  const tables = await queryAllTables()

  // Inline photo Blobs as base64 so a JSON export is fully self-contained.
  // Older exports only carried `hasPhoto: true` and dropped the bytes; this
  // version captures the real data so a restore can recover the user's
  // movement photos.
  const movementsForExport = await Promise.all(
    tables.movements.map(async ({ photo, ...rest }) => {
      if (!photo) return { ...rest, hasPhoto: false }
      return {
        ...rest,
        hasPhoto: true,
        photoBase64: await blobToBase64(photo),
        photoType: photo.type || 'application/octet-stream',
      }
    }),
  )

  const data = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    ...tables,
    movements: movementsForExport,
  }

  return JSON.stringify(data, null, 2)
}

// Snapshot used by the GitHub coach-sync mirror (see src/lib/github-sync.ts).
// Same shape/version as exportAllData, but movement photos are dropped
// entirely (not even a hasPhoto flag) — they're large base64 blobs and are
// derivable from the public exercise-image repo, so shipping them on every
// workout save would be a large, pointless payload over a phone connection.
export async function exportForSync(): Promise<string> {
  const tables = await queryAllTables()

  const movementsForSync = tables.movements.map(({ photo: _photo, ...rest }) => rest)

  const data = {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    ...tables,
    movements: movementsForSync,
  }

  return JSON.stringify(data)
}

// ───────────────── Validation ─────────────────

class ImportValidationError extends Error {
  constructor(message: string) {
    super(`Invalid backup: ${message}`)
    this.name = 'ImportValidationError'
  }
}

// Required tables — must be arrays of objects with string ids. Programs +
// programDays + activePrograms were added later, so we treat them as
// optional and default to [].
const REQUIRED_TABLES = [
  'movements',
  'progressions',
  'progressionLevels',
  'workouts',
  'workoutBlocks',
  'blockEntries',
  'workoutLogs',
  'setLogs',
] as const

const OPTIONAL_TABLES = [
  'programs',
  'programDays',
  'activePrograms',
  'bodyweightLogs',
  'goals',
  'skills',
] as const

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function validateRows(table: string, rows: unknown): Record<string, unknown>[] {
  if (!Array.isArray(rows)) {
    throw new ImportValidationError(`${table} must be an array`)
  }
  rows.forEach((row, i) => {
    if (!isObject(row)) {
      throw new ImportValidationError(`${table}[${i}] must be an object`)
    }
    if (typeof row.id !== 'string' || row.id === '') {
      throw new ImportValidationError(`${table}[${i}] missing required string id`)
    }
  })
  return rows as Record<string, unknown>[]
}

interface ValidatedImport {
  movements: Record<string, unknown>[]
  progressions: Record<string, unknown>[]
  progressionLevels: Record<string, unknown>[]
  workouts: Record<string, unknown>[]
  workoutBlocks: Record<string, unknown>[]
  blockEntries: Record<string, unknown>[]
  workoutLogs: Record<string, unknown>[]
  setLogs: Record<string, unknown>[]
  programs: Record<string, unknown>[]
  programDays: Record<string, unknown>[]
  activePrograms: Record<string, unknown>[]
  bodyweightLogs: Record<string, unknown>[]
  goals: Record<string, unknown>[]
  skills: Record<string, unknown>[]
}

function validateImport(parsed: unknown): ValidatedImport {
  if (!isObject(parsed)) {
    throw new ImportValidationError('top-level value must be an object')
  }
  const version = parsed.version
  if (typeof version !== 'number' || !SUPPORTED_IMPORT_VERSIONS.includes(version)) {
    throw new ImportValidationError(
      `unsupported version ${String(version)} (supported: ${SUPPORTED_IMPORT_VERSIONS.join(', ')})`,
    )
  }

  const validated = {} as ValidatedImport
  for (const table of REQUIRED_TABLES) {
    validated[table] = validateRows(table, parsed[table])
  }
  for (const table of OPTIONAL_TABLES) {
    validated[table] = parsed[table] === undefined ? [] : validateRows(table, parsed[table])
  }

  // BlockEntry-specific check: each row must encode a kind (either explicit
  // post-v6, or implicit via legacy progressionId/movementId fields). Caught
  // here instead of at bulkAdd time so we fail before mutating anything.
  validated.blockEntries.forEach((row, i) => {
    const hasKind = typeof row.kind === 'string'
    const hasLegacyDiscriminator =
      typeof row.progressionId === 'string' || typeof row.movementId === 'string'
    if (!hasKind && !hasLegacyDiscriminator) {
      throw new ImportValidationError(
        `blockEntries[${i}] must specify kind or a legacy progressionId/movementId`,
      )
    }
  })

  return validated
}

// ───────────────── Import ─────────────────

export async function importAllData(json: string): Promise<void> {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new ImportValidationError('not valid JSON')
  }
  // Fully validate before we touch the database. If anything is malformed,
  // the user's existing data stays intact.
  const data = validateImport(parsed)

  // Photos: rehydrate from base64 if the export carried bytes, otherwise
  // strip the placeholder fields so they don't land on the Movement row.
  const movementsForImport = data.movements.map((m) => {
    const { hasPhoto: _hasPhoto, photoBase64, photoType, ...rest } = m
    if (typeof photoBase64 === 'string' && photoBase64.length > 0) {
      return {
        ...rest,
        photo: base64ToBlob(photoBase64, typeof photoType === 'string' ? photoType : 'image/webp'),
      }
    }
    return rest
  })

  // BlockEntries: backups from before v6 don't carry the `kind`
  // discriminator. Derive it from the legacy progressionId/movementId so
  // older files import cleanly without going through a separate migration.
  const entriesForImport = data.blockEntries.map((e) => {
    if (e.kind) return e
    if (typeof e.progressionId === 'string') {
      return { ...e, kind: 'progression', movementId: undefined, mode: undefined }
    }
    return { ...e, kind: 'movement', mode: e.mode ?? 'reps', progressionId: undefined }
  })

  await db.transaction(
    'rw',
    [
      db.movements, db.progressions, db.progressionLevels, db.workouts, db.workoutBlocks,
      db.blockEntries, db.workoutLogs, db.setLogs, db.programs, db.programDays, db.activePrograms,
      db.bodyweightLogs, db.goals, db.skills,
    ],
    async () => {
      await db.movements.clear()
      await db.progressions.clear()
      await db.progressionLevels.clear()
      await db.workouts.clear()
      await db.workoutBlocks.clear()
      await db.blockEntries.clear()
      await db.workoutLogs.clear()
      await db.setLogs.clear()
      await db.programs.clear()
      await db.programDays.clear()
      await db.activePrograms.clear()
      await db.bodyweightLogs.clear()
      await db.goals.clear()
      await db.skills.clear()

      // Casts: validateImport guarantees each row is an object with a string
      // id; per-table schema details are trusted to match because the file
      // came from this app's own export format.
      if (movementsForImport.length > 0) await db.movements.bulkAdd(movementsForImport as unknown as Movement[])
      if (data.progressions.length > 0) await db.progressions.bulkAdd(data.progressions as unknown as Progression[])
      if (data.progressionLevels.length > 0) await db.progressionLevels.bulkAdd(data.progressionLevels as unknown as ProgressionLevel[])
      if (data.workouts.length > 0) await db.workouts.bulkAdd(data.workouts as unknown as Workout[])
      if (data.workoutBlocks.length > 0) await db.workoutBlocks.bulkAdd(data.workoutBlocks as unknown as WorkoutBlock[])
      if (entriesForImport.length > 0) await db.blockEntries.bulkAdd(entriesForImport as unknown as BlockEntry[])
      if (data.workoutLogs.length > 0) await db.workoutLogs.bulkAdd(data.workoutLogs as unknown as WorkoutLog[])
      if (data.setLogs.length > 0) await db.setLogs.bulkAdd(data.setLogs as unknown as SetLog[])
      if (data.programs.length > 0) await db.programs.bulkAdd(data.programs as unknown as Program[])
      if (data.programDays.length > 0) await db.programDays.bulkAdd(data.programDays as unknown as ProgramDay[])
      if (data.activePrograms.length > 0) await db.activePrograms.bulkAdd(data.activePrograms as unknown as ActiveProgram[])
      if (data.bodyweightLogs.length > 0) await db.bodyweightLogs.bulkAdd(data.bodyweightLogs as unknown as BodyweightLog[])
      if (data.goals.length > 0) await db.goals.bulkAdd(data.goals as unknown as Goal[])
      if (data.skills.length > 0) await db.skills.bulkAdd(data.skills as unknown as Skill[])
    },
  )
}

export function downloadJson(json: string, filename: string) {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
