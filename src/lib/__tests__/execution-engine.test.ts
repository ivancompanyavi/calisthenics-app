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
    startedAt: Date.now(),
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
      const result = executionReducer(state, { type: 'START' })
      expect(result.phase).toBe('exercise')
    })

    it('sets timer for time-based exercises', () => {
      const state = makeInitializedState({
        phase: 'ready',
        blocks: [makeBlock({ entries: [makeEntry({ mode: 'time', targetSeconds: 45 })] })],
      })
      const result = executionReducer(state, { type: 'START' })
      expect(result.exerciseTimeRemaining).toBe(45)
    })
  })

  describe('TICK_EXERCISE', () => {
    it('decrements time remaining for timed exercises', () => {
      const state = makeInitializedState({
        blocks: [makeBlock({ entries: [makeEntry({ mode: 'time', targetSeconds: 30 })] })],
        exerciseTimeRemaining: 20,
      })
      const result = executionReducer(state, { type: 'TICK_EXERCISE' })
      expect(result.exerciseTimeRemaining).toBe(19)
    })

    it('transitions to adjust when timer reaches zero', () => {
      const state = makeInitializedState({
        blocks: [makeBlock({ entries: [makeEntry({ mode: 'time', targetSeconds: 30 })] })],
        exerciseTimeRemaining: 1,
      })
      const result = executionReducer(state, { type: 'TICK_EXERCISE' })
      expect(result.phase).toBe('adjust')
      expect(result.exerciseTimeRemaining).toBe(0)
    })

    it('increments elapsed time for max-mode exercises', () => {
      const state = makeInitializedState({
        blocks: [makeBlock({ entries: [makeEntry({ mode: 'max' })] })],
        exerciseTimeElapsed: 5,
      })
      const result = executionReducer(state, { type: 'TICK_EXERCISE' })
      expect(result.exerciseTimeElapsed).toBe(6)
    })
  })

  describe('DONE_EXERCISE', () => {
    it('transitions to adjust phase', () => {
      const state = makeInitializedState()
      const result = executionReducer(state, { type: 'DONE_EXERCISE' })
      expect(result.phase).toBe('adjust')
      expect(result.adjustReps).toBe(10)
    })
  })

  describe('CONFIRM_ADJUST', () => {
    it('adds a completed set and advances to rest', () => {
      const state = makeInitializedState({
        phase: 'adjust',
        adjustReps: 10,
        blocks: [makeBlock({ rounds: 3, restSeconds: 60 })],
        currentRound: 0,
      })
      const result = executionReducer(state, { type: 'CONFIRM_ADJUST' })
      expect(result.completedSets).toHaveLength(1)
      expect(result.phase).toBe('resting')
      expect(result.restRemaining).toBe(60)
      expect(result.currentRound).toBe(1)
    })

    it('completes workout when last set in last round of last block', () => {
      const state = makeInitializedState({
        phase: 'adjust',
        adjustReps: 10,
        blocks: [makeBlock({ rounds: 1, restSeconds: 60 })],
        currentRound: 0,
      })
      const result = executionReducer(state, { type: 'CONFIRM_ADJUST' })
      expect(result.phase).toBe('complete')
      expect(result.completedSets).toHaveLength(1)
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
      const result = executionReducer(state, { type: 'CONFIRM_ADJUST' })
      expect(result.phase).toBe('exercise')
      expect(result.currentEntryIndex).toBe(1)
    })
  })

  describe('SKIP_EXERCISE', () => {
    it('adds entry to skipped list and advances', () => {
      const entries = [
        makeEntry({ movementId: 'mov-1' }),
        makeEntry({ movementId: 'mov-2' }),
      ]
      const state = makeInitializedState({
        blocks: [makeBlock({ type: 'superset', entries, rounds: 1 })],
        currentEntryIndex: 0,
      })
      const result = executionReducer(state, { type: 'SKIP_EXERCISE' })
      expect(result.skippedEntries).toHaveLength(1)
      expect(result.currentEntryIndex).toBe(1)
    })
  })

  describe('REST actions', () => {
    it('TICK_REST decrements rest remaining', () => {
      const state = makeInitializedState({ phase: 'resting', restRemaining: 30 })
      const result = executionReducer(state, { type: 'TICK_REST' })
      expect(result.restRemaining).toBe(29)
    })

    it('TICK_REST transitions to exercise when done', () => {
      const state = makeInitializedState({ phase: 'resting', restRemaining: 1 })
      const result = executionReducer(state, { type: 'TICK_REST' })
      expect(result.phase).toBe('exercise')
      expect(result.restRemaining).toBe(0)
    })

    it('SKIP_REST immediately transitions to exercise', () => {
      const state = makeInitializedState({ phase: 'resting', restRemaining: 45 })
      const result = executionReducer(state, { type: 'SKIP_REST' })
      expect(result.phase).toBe('exercise')
      expect(result.restRemaining).toBe(0)
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
    expect(computeProgress(5, 0)).toBe(0)
  })

  it('returns correct fraction', () => {
    expect(computeProgress(3, 12)).toBeCloseTo(0.25)
  })
})
