import type { WorkoutLog, SetLog } from '@/models/types'

export interface NoteMatch {
  workoutLogId: string
  /** True when the workout-level notes field contains the search term. */
  workoutNoteMatched: boolean
  /** Set-level matches: movement name + the matched note text. */
  matchedSets: Array<{ movementName: string; notes: string }>
}

/**
 * Filter workout logs by a case-insensitive substring across workout notes and
 * set notes. Returns one NoteMatch per matching log. Returns an empty array
 * when `term` is blank.
 */
export function searchNotes(
  logs: WorkoutLog[],
  allSetLogs: SetLog[],
  term: string,
): NoteMatch[] {
  const trimmed = term.trim()
  if (!trimmed) return []

  const lower = trimmed.toLowerCase()

  // Group set logs by their parent workout log ID for O(1) lookup per log.
  const setsByLogId = new Map<string, SetLog[]>()
  for (const set of allSetLogs) {
    const bucket = setsByLogId.get(set.workoutLogId)
    if (bucket) {
      bucket.push(set)
    } else {
      setsByLogId.set(set.workoutLogId, [set])
    }
  }

  const matches: NoteMatch[] = []
  for (const log of logs) {
    const workoutNoteMatched = !!log.notes?.toLowerCase().includes(lower)
    const sets = setsByLogId.get(log.id) ?? []
    const matchedSets = sets
      .filter((s) => s.notes?.toLowerCase().includes(lower))
      .map((s) => ({ movementName: s.movementName, notes: s.notes! }))

    if (workoutNoteMatched || matchedSets.length > 0) {
      matches.push({ workoutLogId: log.id, workoutNoteMatched, matchedSets })
    }
  }
  return matches
}
