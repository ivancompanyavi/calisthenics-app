import { describe, it, expect } from 'vitest'
import { searchNotes } from '../notes-search'
import type { WorkoutLog, SetLog } from '@/models/types'

function makeLog(id: string, overrides: Partial<WorkoutLog> = {}): WorkoutLog {
  return {
    id,
    workoutId: 'w1',
    workoutName: 'Test Workout',
    startedAt: 0,
    completedAt: 1000,
    ...overrides,
  }
}

function makeSetLog(
  id: string,
  workoutLogId: string,
  overrides: Partial<SetLog> = {},
): SetLog {
  return {
    id,
    workoutLogId,
    movementId: 'm1',
    movementName: 'Pull Up',
    round: 0,
    order: 0,
    ...overrides,
  }
}

describe('searchNotes', () => {
  it('returns empty array when term is empty string', () => {
    const logs = [makeLog('l1', { notes: 'felt great' })]
    expect(searchNotes(logs, [], '')).toEqual([])
  })

  it('returns empty array when term is whitespace only', () => {
    const logs = [makeLog('l1', { notes: 'felt great' })]
    expect(searchNotes(logs, [], '   ')).toEqual([])
  })

  it('matches on workout-level notes (case-insensitive)', () => {
    const logs = [
      makeLog('l1', { notes: 'Felt STRONG today' }),
      makeLog('l2', { notes: 'bad day' }),
    ]
    const results = searchNotes(logs, [], 'strong')
    expect(results).toHaveLength(1)
    expect(results[0].workoutLogId).toBe('l1')
    expect(results[0].workoutNoteMatched).toBe(true)
    expect(results[0].matchedSets).toEqual([])
  })

  it('matches on set-level notes (case-insensitive)', () => {
    const logs = [makeLog('l1')]
    const sets = [
      makeSetLog('s1', 'l1', { movementName: 'Pull Up', notes: 'elbow twinge' }),
      makeSetLog('s2', 'l1', { movementName: 'Push Up', notes: 'felt good', order: 1 }),
    ]
    const results = searchNotes(logs, sets, 'TWINGE')
    expect(results).toHaveLength(1)
    expect(results[0].workoutLogId).toBe('l1')
    expect(results[0].workoutNoteMatched).toBe(false)
    expect(results[0].matchedSets).toHaveLength(1)
    expect(results[0].matchedSets[0].movementName).toBe('Pull Up')
    expect(results[0].matchedSets[0].notes).toBe('elbow twinge')
  })

  it('does not include logs with no matching notes', () => {
    const logs = [makeLog('l1', { notes: 'great session' })]
    const results = searchNotes(logs, [], 'injury')
    expect(results).toHaveLength(0)
  })

  it('includes a log when both workout and set notes match', () => {
    const logs = [makeLog('l1', { notes: 'knee pain today' })]
    const sets = [
      makeSetLog('s1', 'l1', { movementName: 'Squat', notes: 'knee pain on descent' }),
    ]
    const results = searchNotes(logs, sets, 'pain')
    expect(results).toHaveLength(1)
    expect(results[0].workoutNoteMatched).toBe(true)
    expect(results[0].matchedSets).toHaveLength(1)
  })

  it('correctly associates set logs with their parent workout log', () => {
    const logs = [makeLog('l1'), makeLog('l2')]
    const sets = [
      makeSetLog('s1', 'l1', { notes: 'shoulder clicked' }),
      makeSetLog('s2', 'l2', { notes: 'felt smooth' }),
    ]
    const results = searchNotes(logs, sets, 'clicked')
    expect(results).toHaveLength(1)
    expect(results[0].workoutLogId).toBe('l1')
  })

  it('ignores set logs with no notes field', () => {
    const logs = [makeLog('l1')]
    const sets = [makeSetLog('s1', 'l1')]
    const results = searchNotes(logs, sets, 'pull')
    expect(results).toHaveLength(0)
  })

  it('returns multiple matches across different logs', () => {
    const logs = [
      makeLog('l1', { notes: 'great form day' }),
      makeLog('l2', { notes: 'off day' }),
      makeLog('l3', { notes: 'form was solid' }),
    ]
    const results = searchNotes(logs, [], 'form')
    expect(results).toHaveLength(2)
    expect(results.map((r) => r.workoutLogId)).toEqual(['l1', 'l3'])
  })

  it('handles multiple matched set notes per log', () => {
    const logs = [makeLog('l1')]
    const sets = [
      makeSetLog('s1', 'l1', { movementName: 'Pull Up', notes: 'felt tight', order: 0 }),
      makeSetLog('s2', 'l1', { movementName: 'Row', notes: 'shoulders tight', order: 1 }),
    ]
    const results = searchNotes(logs, sets, 'tight')
    expect(results).toHaveLength(1)
    expect(results[0].matchedSets).toHaveLength(2)
  })
})
