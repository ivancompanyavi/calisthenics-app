import { describe, it, expect } from 'vitest'
import {
  executionReducer,
  initialState,
  getCurrentEntry,
  getNextPosition,
  isLastEntryInRestGroup,
  computeTotalSets,
  computeProgress,
  type ExecutionState,
  type ResolvedBlock,
} from '../execution-engine'

const T0 = 1_700_000_000_000

function makeEntry(overrides = {}) {
  return {
    progressionId: 'prog-1',
    movementId: 'mov-1',
    movementName: 'Push Up',
    mode: 'reps' as const,
    targetReps: 10,
    ...overrides,
  }
}

function makeBlock(overrides: Partial<ResolvedBlock> = {}): ResolvedBlock {
  return {
    type: 'set',
    rounds: 3,
    restSeconds: 60,
    entries: [makeEntry()],
    ...overrides,
  }
}

function makeInitializedState(overrides: Partial<ExecutionState> = {}): ExecutionState {
  return {
    ...initialState,
    workoutId: 'w-1',
    workoutName: 'Test Workout',
    blocks: [makeBlock()],
    startedAt: T0,
    phase: 'exercise',
    ...overrides,
  }
}

describe('executionReducer', () => {
  describe('INIT', () => {
    it('sets workout data and resets to ready phase', () => {
      const blocks = [makeBlock()]
      const result = executionReducer(initialState, {
        type: 'INIT',
        payload: {
          workoutId: 'w-1',
          workoutName: 'Morning Routine',
          blocks,
          startedAt: 1000,
          currentBlockIndex: 0,
          currentRound: 0,
          currentEntryIndex: 0,
          completedSets: [],
        },
      })

      expect(result.phase).toBe('ready')
      expect(result.workoutId).toBe('w-1')
      expect(result.workoutName).toBe('Morning Routine')
      expect(result.blocks).toEqual(blocks)
      expect(result.startedAt).toBe(1000)
    })

    it('resumes from a saved position', () => {
      const result = executionReducer(initialState, {
        type: 'INIT',
        payload: {
          workoutId: 'w-1',
          workoutName: 'Workout',
          blocks: [makeBlock()],
          startedAt: 1000,
          currentBlockIndex: 0,
          currentRound: 2,
          currentEntryIndex: 0,
          completedSets: [{ id: 's-1', workoutLogId: '', movementId: 'mov-1', movementName: 'Push Up', targetReps: 10, actualReps: 10, round: 0, order: 0 }],
        },
      })

      expect(result.currentRound).toBe(2)
      expect(result.completedSets).toHaveLength(1)
    })
  })

  describe('START', () => {
    it('transitions from ready to exercise', () => {
      const state = makeInitializedState({ phase: 'ready' })
      const result = executionReducer(state, { type: 'START', now: T0 })
      expect(result.phase).toBe('exercise')
    })

    it('sets timer endsAt for time-based exercises', () => {
      const state = makeInitializedState({
        phase: 'ready',
        blocks: [makeBlock({ entries: [makeEntry({ mode: 'time', targetSeconds: 45 })] })],
      })
      const result = executionReducer(state, { type: 'START', now: T0 })
      expect(result.exerciseTimeRemaining).toBe(45)
      expect(result.exerciseEndsAt).toBe(T0 + 45_000)
    })

    it('sets startedAt for max-mode exercises', () => {
      const state = makeInitializedState({
        phase: 'ready',
        blocks: [makeBlock({ entries: [makeEntry({ mode: 'max' })] })],
      })
      const result = executionReducer(state, { type: 'START', now: T0 })
      expect(result.exerciseStartedAt).toBe(T0)
      expect(result.exerciseTimeElapsed).toBe(0)
    })
  })

  describe('TICK_EXERCISE', () => {
    it('recomputes remaining from endsAt for timed exercises', () => {
      const state = makeInitializedState({
        blocks: [makeBlock({ entries: [makeEntry({ mode: 'time', targetSeconds: 30 })] })],
        exerciseTimeRemaining: 30,
        exerciseEndsAt: T0 + 30_000,
      })
      const result = executionReducer(state, { type: 'TICK_EXERCISE', now: T0 + 11_000 })
      expect(result.exerciseTimeRemaining).toBe(19)
    })

    it('survives a long backgrounding — remaining stays correct after >1s gap', () => {
      // Simulates the phone being locked for 25s — interval doesn't fire but on
      // resume one tick should jump straight to the correct remaining time.
      const state = makeInitializedState({
        blocks: [makeBlock({ entries: [makeEntry({ mode: 'time', targetSeconds: 60 })] })],
        exerciseTimeRemaining: 60,
        exerciseEndsAt: T0 + 60_000,
      })
      const result = executionReducer(state, { type: 'TICK_EXERCISE', now: T0 + 25_000 })
      expect(result.exerciseTimeRemaining).toBe(35)
    })

    it('transitions to adjust when timer has elapsed', () => {
      const state = makeInitializedState({
        blocks: [makeBlock({ entries: [makeEntry({ mode: 'time', targetSeconds: 30 })] })],
        exerciseTimeRemaining: 1,
        exerciseEndsAt: T0 + 1_000,
      })
      const result = executionReducer(state, { type: 'TICK_EXERCISE', now: T0 + 1_500 })
      expect(result.phase).toBe('adjust')
      expect(result.exerciseTimeRemaining).toBe(0)
    })

    it('computes elapsed from startedAt for max-mode exercises', () => {
      const state = makeInitializedState({
        blocks: [makeBlock({ entries: [makeEntry({ mode: 'max' })] })],
        exerciseStartedAt: T0,
        exerciseTimeElapsed: 0,
      })
      const result = executionReducer(state, { type: 'TICK_EXERCISE', now: T0 + 6_400 })
      expect(result.exerciseTimeElapsed).toBe(6)
    })
  })

  describe('DONE_EXERCISE', () => {
    it('transitions to adjust phase', () => {
      const state = makeInitializedState()
      const result = executionReducer(state, { type: 'DONE_EXERCISE', now: T0 })
      expect(result.phase).toBe('adjust')
      expect(result.adjustReps).toBe(10)
    })

    it('snapshots elapsed time for max-mode at finish', () => {
      const state = makeInitializedState({
        blocks: [makeBlock({ entries: [makeEntry({ mode: 'max' })] })],
        exerciseStartedAt: T0,
      })
      const result = executionReducer(state, { type: 'DONE_EXERCISE', now: T0 + 12_000 })
      expect(result.adjustSeconds).toBe(12)
      expect(result.exerciseTimeElapsed).toBe(12)
    })
  })

  describe('CONFIRM_ADJUST', () => {
    it('adds a completed set and advances to rest with endsAt set', () => {
      const state = makeInitializedState({
        phase: 'adjust',
        adjustReps: 10,
        blocks: [makeBlock({ rounds: 3, restSeconds: 60 })],
        currentRound: 0,
      })
      const result = executionReducer(state, { type: 'CONFIRM_ADJUST', now: T0 })
      expect(result.completedSets).toHaveLength(1)
      expect(result.phase).toBe('resting')
      expect(result.restRemaining).toBe(60)
      expect(result.restTotal).toBe(60)
      expect(result.restEndsAt).toBe(T0 + 60_000)
      expect(result.currentRound).toBe(1)
    })

    it('completes workout when last set in last round of last block', () => {
      const state = makeInitializedState({
        phase: 'adjust',
        adjustReps: 10,
        blocks: [makeBlock({ rounds: 1, restSeconds: 60 })],
        currentRound: 0,
      })
      const result = executionReducer(state, { type: 'CONFIRM_ADJUST', now: T0 })
      expect(result.phase).toBe('complete')
      expect(result.completedSets).toHaveLength(1)
    })

    it('threads progressionId from the resolved entry into the SetLog', () => {
      const state = makeInitializedState({
        phase: 'adjust',
        adjustReps: 10,
        blocks: [makeBlock({
          rounds: 1, restSeconds: 60,
          entries: [makeEntry({ progressionId: 'prog-pull', movementId: 'mv-row' })],
        })],
        currentRound: 0,
      })
      const result = executionReducer(state, { type: 'CONFIRM_ADJUST', now: T0 })
      expect(result.completedSets[0].progressionId).toBe('prog-pull')
      expect(result.completedSets[0].movementId).toBe('mv-row')
    })

    it('omits progressionId on the SetLog for standalone movement entries', () => {
      const state = makeInitializedState({
        phase: 'adjust',
        adjustReps: 10,
        blocks: [makeBlock({
          rounds: 1, restSeconds: 60,
          entries: [makeEntry({ progressionId: undefined, movementId: 'mv-solo' })],
        })],
        currentRound: 0,
      })
      const result = executionReducer(state, { type: 'CONFIRM_ADJUST', now: T0 })
      expect(result.completedSets[0].progressionId).toBeUndefined()
      expect(result.completedSets[0].movementId).toBe('mv-solo')
    })

    it('advances to next entry in superset without rest', () => {
      const entries = [
        makeEntry({ movementId: 'mov-1', movementName: 'Push Up' }),
        makeEntry({ movementId: 'mov-2', movementName: 'Pull Up' }),
      ]
      const state = makeInitializedState({
        phase: 'adjust',
        adjustReps: 10,
        blocks: [makeBlock({ type: 'superset', rounds: 1, entries })],
        currentEntryIndex: 0,
      })
      const result = executionReducer(state, { type: 'CONFIRM_ADJUST', now: T0 })
      expect(result.phase).toBe('exercise')
      expect(result.currentEntryIndex).toBe(1)
    })

    it('persists weight and band level from adjust state into SetLog', () => {
      const state = makeInitializedState({
        phase: 'adjust',
        adjustReps: 8,
        adjustWeightKg: 15,
        adjustBandLevel: 3,
        blocks: [makeBlock({
          rounds: 1, restSeconds: 60,
          entries: [makeEntry({ targetWeightKg: 12, targetBandLevel: 2 })],
        })],
        currentRound: 0,
      })
      const result = executionReducer(state, { type: 'CONFIRM_ADJUST', now: T0 })
      const set = result.completedSets[0]
      expect(set.actualWeightKg).toBe(15)
      expect(set.actualBandLevel).toBe(3)
      expect(set.targetWeightKg).toBe(12)
      expect(set.targetBandLevel).toBe(2)
    })

    it('resets adjust weight/band fields after confirming a set', () => {
      const state = makeInitializedState({
        phase: 'adjust',
        adjustReps: 8,
        adjustWeightKg: 15,
        adjustBandLevel: 3,
        blocks: [makeBlock({ rounds: 3, restSeconds: 60 })],
        currentRound: 0,
      })
      const result = executionReducer(state, { type: 'CONFIRM_ADJUST', now: T0 })
      expect(result.adjustWeightKg).toBeUndefined()
      expect(result.adjustBandLevel).toBeUndefined()
    })

    it('persists sir from adjust state into the SetLog for time/max sets', () => {
      const state = makeInitializedState({
        phase: 'adjust',
        adjustSeconds: 20,
        adjustSir: 1,
        blocks: [makeBlock({
          rounds: 1, restSeconds: 60,
          entries: [makeEntry({ mode: 'time', targetSeconds: 30 })],
        })],
        currentRound: 0,
      })
      const result = executionReducer(state, { type: 'CONFIRM_ADJUST', now: T0 })
      expect(result.completedSets[0].sir).toBe(1)
    })

    it('resets adjustSir after confirming a set', () => {
      const state = makeInitializedState({
        phase: 'adjust',
        adjustSeconds: 20,
        adjustSir: 2,
        blocks: [makeBlock({
          rounds: 3, restSeconds: 60,
          entries: [makeEntry({ mode: 'max' })],
        })],
        currentRound: 0,
      })
      const result = executionReducer(state, { type: 'CONFIRM_ADJUST', now: T0 })
      expect(result.adjustSir).toBeUndefined()
    })

    it('SET_ADJUST_SIR updates adjustSir in state', () => {
      const state = makeInitializedState({ phase: 'adjust' })
      const result = executionReducer(state, { type: 'SET_ADJUST_SIR', value: 0 })
      expect(result.adjustSir).toBe(0)
    })

    it('SET_ADJUST_SIR can be cleared by passing undefined', () => {
      const state = makeInitializedState({ phase: 'adjust', adjustSir: 2 })
      const result = executionReducer(state, { type: 'SET_ADJUST_SIR', value: undefined })
      expect(result.adjustSir).toBeUndefined()
    })
  })

  describe('SWAP_EXERCISE', () => {
    const BANDED = {
      id: 'mov-banded',
      name: 'Band-Assisted Pull-Ups',
      description: 'Pull-ups with a band for assistance.',
    }

    it('replaces the exercise and remembers what was prescribed', () => {
      const state = makeInitializedState({
        blocks: [makeBlock({ entries: [makeEntry({ movementId: 'mov-1', movementName: 'Pull-Ups' })] })],
      })
      const result = executionReducer(state, { type: 'SWAP_EXERCISE', movement: BANDED })
      const entry = getCurrentEntry(result)!
      expect(entry.movementId).toBe('mov-banded')
      expect(entry.movementName).toBe('Band-Assisted Pull-Ups')
      expect(entry.swappedFrom).toEqual({ movementId: 'mov-1', movementName: 'Pull-Ups' })
    })

    it('keeps the prescription — this swaps the exercise, not the dose', () => {
      const state = makeInitializedState({
        blocks: [makeBlock({ entries: [makeEntry({ targetReps: 8, restSeconds: 90 })] })],
      })
      const entry = getCurrentEntry(
        executionReducer(state, { type: 'SWAP_EXERCISE', movement: BANDED }),
      )!
      expect(entry.targetReps).toBe(8)
      expect(entry.restSeconds).toBe(90)
    })

    it('drops the auto-progression suggestion — it was for the other movement', () => {
      const state = makeInitializedState({
        blocks: [makeBlock({ entries: [makeEntry({ suggestedReps: 12, suggestedRepsReason: 'clean hit' })] })],
      })
      const entry = getCurrentEntry(
        executionReducer(state, { type: 'SWAP_EXERCISE', movement: BANDED }),
      )!
      expect(entry.suggestedReps).toBeUndefined()
      expect(entry.suggestedRepsReason).toBeUndefined()
    })

    it('swapping back to the prescribed movement is not a deviation', () => {
      const state = makeInitializedState({
        blocks: [makeBlock({ entries: [makeEntry({ movementId: 'mov-1', movementName: 'Pull-Ups' })] })],
      })
      const swapped = executionReducer(state, { type: 'SWAP_EXERCISE', movement: BANDED })
      const back = executionReducer(swapped, {
        type: 'SWAP_EXERCISE',
        movement: { id: 'mov-1', name: 'Pull-Ups' },
      })
      expect(getCurrentEntry(back)!.swappedFrom).toBeUndefined()
    })

    it('only affects the current entry', () => {
      const entries = [makeEntry({ movementId: 'mov-1' }), makeEntry({ movementId: 'mov-2' })]
      const state = makeInitializedState({
        blocks: [makeBlock({ type: 'superset', entries })],
        currentEntryIndex: 0,
      })
      const result = executionReducer(state, { type: 'SWAP_EXERCISE', movement: BANDED })
      expect(result.blocks[0].entries[1].movementId).toBe('mov-2')
    })

    it('is a no-op outside the exercise phase', () => {
      const state = makeInitializedState({ phase: 'resting' })
      const result = executionReducer(state, { type: 'SWAP_EXERCISE', movement: BANDED })
      expect(result).toBe(state)
    })

    it('records the swap on the set log so history shows the deviation', () => {
      const state = makeInitializedState({
        blocks: [makeBlock({ rounds: 1, entries: [makeEntry({ movementId: 'mov-1', movementName: 'Pull-Ups' })] })],
      })
      const swapped = executionReducer(state, { type: 'SWAP_EXERCISE', movement: BANDED })
      const confirmed = executionReducer(
        { ...swapped, phase: 'adjust', adjustReps: 6 },
        { type: 'CONFIRM_ADJUST', now: T0 },
      )
      const set = confirmed.completedSets[0]
      // What was actually done — so the PR lands on the banded variant, and a
      // Pull-Ups PR can't be inflated by an assisted set.
      expect(set.movementId).toBe('mov-banded')
      expect(set.actualReps).toBe(6)
      // What the program asked for.
      expect(set.prescribedMovementId).toBe('mov-1')
      expect(set.prescribedMovementName).toBe('Pull-Ups')
    })

    it('leaves the prescribed fields unset when performed as written', () => {
      const state = makeInitializedState({
        blocks: [makeBlock({ rounds: 1 })],
        phase: 'adjust',
        adjustReps: 10,
      })
      const confirmed = executionReducer(state, { type: 'CONFIRM_ADJUST', now: T0 })
      expect(confirmed.completedSets[0].prescribedMovementId).toBeUndefined()
    })
  })

  describe('DELAY_EXERCISE', () => {
    it('adds entry to skipped list and advances', () => {
      const entries = [
        makeEntry({ movementId: 'mov-1' }),
        makeEntry({ movementId: 'mov-2' }),
      ]
      const state = makeInitializedState({
        blocks: [makeBlock({ type: 'superset', entries, rounds: 1 })],
        currentEntryIndex: 0,
      })
      const result = executionReducer(state, { type: 'DELAY_EXERCISE', now: T0 })
      expect(result.skippedEntries).toHaveLength(1)
      expect(result.currentEntryIndex).toBe(1)
    })
  })

  describe('SKIP_EXERCISE', () => {
    it('adds entry to cancelled list and logs skipped set', () => {
      const entries = [
        makeEntry({ movementId: 'mov-1', movementName: 'Push-Ups' }),
        makeEntry({ movementId: 'mov-2' }),
      ]
      const state = makeInitializedState({
        blocks: [makeBlock({ type: 'superset', entries, rounds: 1 })],
        currentEntryIndex: 0,
      })
      const result = executionReducer(state, { type: 'SKIP_EXERCISE', now: T0 })
      expect(result.cancelledEntries).toHaveLength(1)
      expect(result.completedSets).toHaveLength(1)
      expect(result.completedSets[0].skipped).toBe(true)
      expect(result.completedSets[0].movementId).toBe('mov-1')
      expect(result.currentEntryIndex).toBe(1)
    })
  })

  describe('REST actions', () => {
    it('TICK_REST recomputes remaining from endsAt', () => {
      const state = makeInitializedState({
        phase: 'resting',
        restRemaining: 30,
        restTotal: 30,
        restEndsAt: T0 + 30_000,
      })
      const result = executionReducer(state, { type: 'TICK_REST', now: T0 + 1_000 })
      expect(result.restRemaining).toBe(29)
    })

    it('TICK_REST survives long backgrounding', () => {
      // Phone locked for the entire 60s rest — coming back, timer should be at 0.
      const state = makeInitializedState({
        phase: 'resting',
        restRemaining: 60,
        restTotal: 60,
        restEndsAt: T0 + 60_000,
      })
      const result = executionReducer(state, { type: 'TICK_REST', now: T0 + 75_000 })
      expect(result.phase).toBe('exercise')
      expect(result.restRemaining).toBe(0)
    })

    it('TICK_REST transitions to exercise when endsAt has passed', () => {
      const state = makeInitializedState({
        phase: 'resting',
        restRemaining: 1,
        restTotal: 60,
        restEndsAt: T0 + 1_000,
      })
      const result = executionReducer(state, { type: 'TICK_REST', now: T0 + 1_500 })
      expect(result.phase).toBe('exercise')
      expect(result.restRemaining).toBe(0)
    })

    it('SKIP_REST immediately transitions to exercise', () => {
      const state = makeInitializedState({
        phase: 'resting',
        restRemaining: 45,
        restEndsAt: T0 + 45_000,
      })
      const result = executionReducer(state, { type: 'SKIP_REST', now: T0 })
      expect(result.phase).toBe('exercise')
      expect(result.restRemaining).toBe(0)
      expect(result.restEndsAt).toBe(0)
    })

    it('TICK_REST with omitted noAutoStart auto-advances at expiry (default/original behavior)', () => {
      // Default path: waitAfterRest=false → hook passes noAutoStart undefined/false.
      // The reducer must auto-transition rest→exercise exactly as it always did,
      // which is also what fires the merged end-of-rest cue.
      const state = makeInitializedState({
        phase: 'resting',
        restRemaining: 1,
        restTotal: 60,
        restEndsAt: T0 + 1_000,
      })
      const result = executionReducer(state, { type: 'TICK_REST', now: T0 + 1_500 })
      expect(result.phase).toBe('exercise')
      expect(result.restRemaining).toBe(0)
      expect(result.restEndsAt).toBe(0)
    })

    it('TICK_REST with noAutoStart=false auto-advances at expiry (explicit default)', () => {
      const state = makeInitializedState({
        phase: 'resting',
        restRemaining: 1,
        restTotal: 60,
        restEndsAt: T0 + 1_000,
      })
      const result = executionReducer(state, { type: 'TICK_REST', now: T0 + 1_500, noAutoStart: false })
      expect(result.phase).toBe('exercise')
      expect(result.restRemaining).toBe(0)
    })

    it('TICK_REST with noAutoStart=true clamps restRemaining to 0 without transitioning', () => {
      // Opt-in wait path: freeze at 0:00, stay in resting until a manual tap.
      const state = makeInitializedState({
        phase: 'resting',
        restRemaining: 1,
        restTotal: 60,
        restEndsAt: T0 + 1_000,
      })
      const result = executionReducer(state, { type: 'TICK_REST', now: T0 + 1_500, noAutoStart: true })
      expect(result.phase).toBe('resting')
      expect(result.restRemaining).toBe(0)
    })

    it('TICK_REST with noAutoStart=true stays at 0 after backgrounding without transitioning', () => {
      const state = makeInitializedState({
        phase: 'resting',
        restRemaining: 60,
        restTotal: 60,
        restEndsAt: T0 + 60_000,
      })
      const result = executionReducer(state, { type: 'TICK_REST', now: T0 + 75_000, noAutoStart: true })
      expect(result.phase).toBe('resting')
      expect(result.restRemaining).toBe(0)
    })
  })

  describe('ADJUST_REST', () => {
    function makeRestingState(restRemaining = 60, restEndsAt = T0 + 60_000) {
      return makeInitializedState({
        phase: 'resting',
        restRemaining,
        restTotal: 60,
        restEndsAt,
      })
    }

    it('+30s increases restEndsAt and restRemaining', () => {
      const state = makeRestingState(60, T0 + 60_000)
      const result = executionReducer(state, { type: 'ADJUST_REST', delta: 30, now: T0 })
      expect(result.restEndsAt).toBe(T0 + 90_000)
      expect(result.restRemaining).toBe(90)
      expect(result.phase).toBe('resting')
    })

    it('-30s decreases restEndsAt and restRemaining when remaining > 30s', () => {
      const state = makeRestingState(60, T0 + 60_000)
      const result = executionReducer(state, { type: 'ADJUST_REST', delta: -30, now: T0 })
      expect(result.restEndsAt).toBe(T0 + 30_000)
      expect(result.restRemaining).toBe(30)
      expect(result.phase).toBe('resting')
    })

    it('-30s when remaining is 20s clamps to 0 and transitions to exercise immediately', () => {
      const state = makeRestingState(20, T0 + 20_000)
      const result = executionReducer(state, { type: 'ADJUST_REST', delta: -30, now: T0 })
      expect(result.phase).toBe('exercise')
      expect(result.restRemaining).toBe(0)
      expect(result.restEndsAt).toBe(0)
    })

    it('-30s when remaining is exactly 30s clamps to 0 and transitions to exercise', () => {
      const state = makeRestingState(30, T0 + 30_000)
      const result = executionReducer(state, { type: 'ADJUST_REST', delta: -30, now: T0 })
      // newEndsAt = T0 + 30_000 - 30_000 = T0 = now; clamped to 0
      expect(result.phase).toBe('exercise')
      expect(result.restRemaining).toBe(0)
    })

    it('arms exercise timer (time mode) when clamped immediately', () => {
      const state = makeInitializedState({
        phase: 'resting',
        restRemaining: 5,
        restTotal: 60,
        restEndsAt: T0 + 5_000,
        blocks: [makeBlock({ entries: [makeEntry({ mode: 'time', targetSeconds: 30 })] })],
      })
      const result = executionReducer(state, { type: 'ADJUST_REST', delta: -30, now: T0 })
      expect(result.phase).toBe('exercise')
      expect(result.exerciseEndsAt).toBe(T0 + 30_000)
      expect(result.exerciseTimeRemaining).toBe(30)
    })

    it('is a no-op when not in resting phase', () => {
      const state = makeInitializedState({ phase: 'exercise' })
      const result = executionReducer(state, { type: 'ADJUST_REST', delta: 30, now: T0 })
      expect(result).toBe(state)
    })
  })
})

describe('getCurrentEntry', () => {
  it('returns the current entry based on indices', () => {
    const entry = makeEntry()
    const state = makeInitializedState({
      blocks: [makeBlock({ entries: [entry] })],
      currentBlockIndex: 0,
      currentEntryIndex: 0,
    })
    expect(getCurrentEntry(state)).toEqual(entry)
  })

  it('returns null for invalid block index', () => {
    const state = makeInitializedState({ currentBlockIndex: 5 })
    expect(getCurrentEntry(state)).toBeNull()
  })
})

describe('getNextPosition', () => {
  it('returns next entry in same round for superset', () => {
    const state = makeInitializedState({
      blocks: [makeBlock({ type: 'superset', entries: [makeEntry(), makeEntry()], rounds: 1 })],
      currentEntryIndex: 0,
    })
    expect(getNextPosition(state)).toEqual({ blockIndex: 0, round: 0, entryIndex: 1 })
  })

  it('returns next round when entries exhausted', () => {
    const state = makeInitializedState({
      blocks: [makeBlock({ rounds: 3, entries: [makeEntry()] })],
      currentEntryIndex: 0,
      currentRound: 0,
    })
    expect(getNextPosition(state)).toEqual({ blockIndex: 0, round: 1, entryIndex: 0 })
  })

  it('returns next block when rounds exhausted', () => {
    const state = makeInitializedState({
      blocks: [makeBlock({ rounds: 1 }), makeBlock({ rounds: 1 })],
      currentBlockIndex: 0,
      currentRound: 0,
      currentEntryIndex: 0,
    })
    expect(getNextPosition(state)).toEqual({ blockIndex: 1, round: 0, entryIndex: 0 })
  })

  it('returns null when all blocks done', () => {
    const state = makeInitializedState({
      blocks: [makeBlock({ rounds: 1 })],
      currentBlockIndex: 0,
      currentRound: 0,
      currentEntryIndex: 0,
    })
    expect(getNextPosition(state)).toBeNull()
  })
})

describe('isLastEntryInRestGroup', () => {
  it('always returns true for set-type blocks', () => {
    const state = makeInitializedState({
      blocks: [makeBlock({ type: 'set', entries: [makeEntry(), makeEntry()] })],
      currentEntryIndex: 0,
    })
    expect(isLastEntryInRestGroup(state)).toBe(true)
  })

  it('returns false for non-last entry in superset', () => {
    const state = makeInitializedState({
      blocks: [makeBlock({ type: 'superset', entries: [makeEntry(), makeEntry()] })],
      currentEntryIndex: 0,
    })
    expect(isLastEntryInRestGroup(state)).toBe(false)
  })

  it('returns true for last entry in superset', () => {
    const state = makeInitializedState({
      blocks: [makeBlock({ type: 'superset', entries: [makeEntry(), makeEntry()] })],
      currentEntryIndex: 1,
    })
    expect(isLastEntryInRestGroup(state)).toBe(true)
  })
})

describe('computeTotalSets', () => {
  it('sums entries * rounds across all blocks', () => {
    const blocks = [
      makeBlock({ rounds: 3, entries: [makeEntry(), makeEntry()] }),
      makeBlock({ rounds: 2, entries: [makeEntry()] }),
    ]
    expect(computeTotalSets(blocks)).toBe(8)
  })
})

describe('computeProgress', () => {
  it('returns 0 when no total sets', () => {
    expect(computeProgress(5, 0, 0)).toBe(0)
  })

  it('returns correct fraction', () => {
    expect(computeProgress(3, 12, 0)).toBeCloseTo(0.25)
  })

  it('excludes cancelled sets from denominator', () => {
    expect(computeProgress(3, 12, 2)).toBeCloseTo(0.3)
  })
})

describe('REORDER_BLOCK_ENTRIES', () => {
  const entryA = makeEntry({ movementId: 'mov-a', movementName: 'Pull Up' })
  const entryB = makeEntry({ movementId: 'mov-b', movementName: 'Dip' })
  const entryC = makeEntry({ movementId: 'mov-c', movementName: 'Row' })

  function makeReadyState(entries: ReturnType<typeof makeEntry>[]) {
    return makeInitializedState({
      phase: 'ready',
      blocks: [makeBlock({ type: 'superset', entries })],
    })
  }

  it('moves entry down one position', () => {
    const state = makeReadyState([entryA, entryB, entryC])
    const result = executionReducer(state, {
      type: 'REORDER_BLOCK_ENTRIES',
      blockIndex: 0,
      fromIndex: 0,
      toIndex: 1,
    })
    expect(result.blocks[0].entries.map((e) => e.movementName)).toEqual([
      'Dip', 'Pull Up', 'Row',
    ])
  })

  it('moves entry up one position', () => {
    const state = makeReadyState([entryA, entryB, entryC])
    const result = executionReducer(state, {
      type: 'REORDER_BLOCK_ENTRIES',
      blockIndex: 0,
      fromIndex: 2,
      toIndex: 1,
    })
    expect(result.blocks[0].entries.map((e) => e.movementName)).toEqual([
      'Pull Up', 'Row', 'Dip',
    ])
  })

  it('moves entry from last to first', () => {
    const state = makeReadyState([entryA, entryB, entryC])
    const result = executionReducer(state, {
      type: 'REORDER_BLOCK_ENTRIES',
      blockIndex: 0,
      fromIndex: 2,
      toIndex: 0,
    })
    expect(result.blocks[0].entries.map((e) => e.movementName)).toEqual([
      'Row', 'Pull Up', 'Dip',
    ])
  })

  it('is a no-op when fromIndex === toIndex', () => {
    const state = makeReadyState([entryA, entryB, entryC])
    const result = executionReducer(state, {
      type: 'REORDER_BLOCK_ENTRIES',
      blockIndex: 0,
      fromIndex: 1,
      toIndex: 1,
    })
    expect(result).toBe(state)
  })

  it('is a no-op when phase is not ready (workout already started)', () => {
    const state = makeInitializedState({
      phase: 'exercise',
      blocks: [makeBlock({ type: 'superset', entries: [entryA, entryB] })],
    })
    const result = executionReducer(state, {
      type: 'REORDER_BLOCK_ENTRIES',
      blockIndex: 0,
      fromIndex: 0,
      toIndex: 1,
    })
    expect(result).toBe(state)
  })

  it('is a no-op for an out-of-range blockIndex', () => {
    const state = makeReadyState([entryA, entryB])
    const result = executionReducer(state, {
      type: 'REORDER_BLOCK_ENTRIES',
      blockIndex: 5,
      fromIndex: 0,
      toIndex: 1,
    })
    expect(result).toBe(state)
  })

  it('is a no-op for an out-of-range fromIndex', () => {
    const state = makeReadyState([entryA, entryB])
    const result = executionReducer(state, {
      type: 'REORDER_BLOCK_ENTRIES',
      blockIndex: 0,
      fromIndex: 5,
      toIndex: 1,
    })
    expect(result).toBe(state)
  })

  it('does not mutate the original blocks array', () => {
    const entries = [entryA, entryB, entryC]
    const state = makeReadyState(entries)
    const originalEntries = [...state.blocks[0].entries]
    executionReducer(state, {
      type: 'REORDER_BLOCK_ENTRIES',
      blockIndex: 0,
      fromIndex: 0,
      toIndex: 2,
    })
    // The original state's block entries must be unchanged
    expect(state.blocks[0].entries).toEqual(originalEntries)
  })

  it('only affects the targeted block; other blocks remain unchanged', () => {
    const block0 = makeBlock({ type: 'superset', entries: [entryA, entryB] })
    const block1 = makeBlock({ entries: [entryC] })
    const state = makeInitializedState({
      phase: 'ready',
      blocks: [block0, block1],
    })
    const result = executionReducer(state, {
      type: 'REORDER_BLOCK_ENTRIES',
      blockIndex: 0,
      fromIndex: 0,
      toIndex: 1,
    })
    expect(result.blocks[1]).toBe(block1)
  })

  it('canonical workout blocks are untouched after reorder', () => {
    // The INIT payload carries the canonical resolved blocks. After a reorder,
    // re-initialising from the same payload must produce the original order.
    const state = makeReadyState([entryA, entryB, entryC])
    const afterReorder = executionReducer(state, {
      type: 'REORDER_BLOCK_ENTRIES',
      blockIndex: 0,
      fromIndex: 0,
      toIndex: 2,
    })
    // Re-init with the original blocks — simulates starting a fresh run
    const reInit = executionReducer(afterReorder, {
      type: 'INIT',
      payload: {
        workoutId: 'w-1',
        workoutName: 'Test Workout',
        blocks: [makeBlock({ type: 'superset', entries: [entryA, entryB, entryC] })],
        startedAt: T0,
        currentBlockIndex: 0,
        currentRound: 0,
        currentEntryIndex: 0,
        completedSets: [],
      },
    })
    expect(reInit.blocks[0].entries.map((e) => e.movementName)).toEqual([
      'Pull Up', 'Dip', 'Row',
    ])
  })
})
