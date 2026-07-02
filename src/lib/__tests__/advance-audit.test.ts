import { describe, it, expect } from 'vitest'
import { auditAdvance } from '../advance-audit'
import type { WorkoutEntryGroup } from '../advance-audit'
import type { BlockEntry } from '@/models/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function movementEntry(movementId: string): BlockEntry {
  return {
    id: `entry-${movementId}`,
    blockId: 'block-1',
    order: 0,
    kind: 'movement',
    movementId,
    mode: 'reps',
  }
}

function progressionEntry(progressionId: string): BlockEntry {
  return {
    id: `entry-prog-${progressionId}`,
    blockId: 'block-1',
    order: 1,
    kind: 'progression',
    progressionId,
  }
}

function group(workoutName: string, entries: BlockEntry[]): WorkoutEntryGroup {
  return { workoutName, entries }
}

// ---------------------------------------------------------------------------
// auditAdvance
// ---------------------------------------------------------------------------

describe('auditAdvance', () => {
  it('returns an empty array when no workout references the movement', () => {
    const groups = [
      group('Pull A', [movementEntry('movement-other')]),
      group('Push A', [progressionEntry('prog-1')]),
    ]
    expect(auditAdvance(groups, 'movement-target')).toEqual([])
  })

  it('returns the name of a single affected workout', () => {
    const groups = [
      group('Pull A', [movementEntry('movement-target')]),
      group('Push A', [movementEntry('movement-other')]),
    ]
    expect(auditAdvance(groups, 'movement-target')).toEqual(['Pull A'])
  })

  it('returns all affected workout names when multiple workouts are affected', () => {
    const groups = [
      group('Pull A', [movementEntry('movement-target')]),
      group('Push A', [movementEntry('movement-other')]),
      group('Full Body', [movementEntry('movement-target'), movementEntry('movement-other')]),
    ]
    // Returned names are sorted alphabetically.
    expect(auditAdvance(groups, 'movement-target')).toEqual(['Full Body', 'Pull A'])
  })

  it('does NOT flag workouts with only progression-kind entries for the same id', () => {
    // A progression-kind entry pointing to the same progression is not a direct
    // movement reference — it resolves at runtime and is intentionally part of
    // the progression chain.
    const groups = [
      group('Pull A', [progressionEntry('prog-1')]),
      group('Push A', [progressionEntry('prog-2')]),
    ]
    expect(auditAdvance(groups, 'movement-target')).toEqual([])
  })

  it('flags only the workout with a movement-kind entry, not the one with a progression-kind entry that happens to share the id string', () => {
    // progressionId strings are different from movementId strings in practice,
    // but even if they collide the kind discriminant ensures correctness.
    const groups = [
      // This progression-kind entry should NOT trigger a flag.
      group('Pull A', [progressionEntry('movement-target')]),
      // This movement-kind entry SHOULD trigger a flag.
      group('Push A', [movementEntry('movement-target')]),
    ]
    expect(auditAdvance(groups, 'movement-target')).toEqual(['Push A'])
  })

  it('returns an empty array for an empty groups list', () => {
    expect(auditAdvance([], 'movement-target')).toEqual([])
  })

  it('flags a workout that has the target movement alongside other movements', () => {
    const groups = [
      group('Mixed Day', [
        movementEntry('movement-a'),
        movementEntry('movement-target'),
        movementEntry('movement-b'),
      ]),
    ]
    expect(auditAdvance(groups, 'movement-target')).toEqual(['Mixed Day'])
  })
})
