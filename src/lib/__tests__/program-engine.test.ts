import { describe, it, expect } from 'vitest'
import {
  makeFreshCycle,
  getCurrentSlotIndex,
  isCycleComplete,
  markSlotDone,
  markSlotSkipped,
  resizeCycle,
} from '../program-engine'

const T0 = 1_700_000_000_000

describe('makeFreshCycle', () => {
  it('returns an array of pending slots of the given length', () => {
    const cycle = makeFreshCycle(7)
    expect(cycle).toHaveLength(7)
    expect(cycle.every((s) => s.status === 'pending')).toBe(true)
  })
})

describe('getCurrentSlotIndex', () => {
  it('returns 0 for a fresh cycle', () => {
    expect(getCurrentSlotIndex(makeFreshCycle(7))).toBe(0)
  })

  it('returns the first pending slot, skipping done slots', () => {
    const cycle = markSlotDone(makeFreshCycle(7), 0, 'log-1', T0)
    expect(getCurrentSlotIndex(cycle)).toBe(1)
  })

  it('returns the first pending slot, skipping done/skipped mix', () => {
    let cycle = makeFreshCycle(7)
    cycle = markSlotDone(cycle, 0, 'log-1', T0)
    cycle = markSlotSkipped(cycle, 1, T0)
    cycle = markSlotDone(cycle, 2, 'log-2', T0)
    expect(getCurrentSlotIndex(cycle)).toBe(3)
  })

  it('returns null when all slots are done or skipped', () => {
    const cycle = makeFreshCycle(2).map(() => ({ status: 'done' as const }))
    expect(getCurrentSlotIndex(cycle)).toBeNull()
  })

  it('handles the swap case: doing a later slot leaves the pointer earlier', () => {
    // Cycle = [Push, Pull A, Legs+Core, ...]. Pointer at Pull A (1).
    // User swaps and does Legs+Core (slot 2). Pointer must stay at Pull A.
    const cycle = markSlotDone(makeFreshCycle(7), 2, 'log-legs', T0)
    expect(getCurrentSlotIndex(cycle)).toBe(0)
    // After they go back and finish Pull A (slot 1) on a later day, pointer
    // skips past slot 2 (already done) to slot 3.
    const after = markSlotDone(
      markSlotDone(cycle, 0, 'log-push', T0),
      1,
      'log-pull',
      T0,
    )
    expect(getCurrentSlotIndex(after)).toBe(3)
  })
})

describe('isCycleComplete', () => {
  it('is false for an empty or partially-done cycle', () => {
    expect(isCycleComplete([])).toBe(false)
    expect(isCycleComplete(makeFreshCycle(3))).toBe(false)
    expect(isCycleComplete(markSlotDone(makeFreshCycle(3), 0, 'l', T0))).toBe(false)
  })

  it('is true when every slot is done or skipped', () => {
    let cycle = makeFreshCycle(3)
    cycle = markSlotDone(cycle, 0, 'l1', T0)
    cycle = markSlotSkipped(cycle, 1, T0)
    cycle = markSlotDone(cycle, 2, 'l2', T0)
    expect(isCycleComplete(cycle)).toBe(true)
  })
})

describe('markSlotDone', () => {
  it('records completion metadata', () => {
    const cycle = markSlotDone(makeFreshCycle(3), 1, 'log-42', T0)
    expect(cycle[1]).toEqual({ status: 'done', completedAt: T0, workoutLogId: 'log-42' })
  })

  it('is a no-op for out-of-range indices', () => {
    const fresh = makeFreshCycle(3)
    expect(markSlotDone(fresh, -1, 'x', T0)).toEqual(fresh)
    expect(markSlotDone(fresh, 99, 'x', T0)).toEqual(fresh)
  })
})

describe('markSlotSkipped', () => {
  it('records skip metadata', () => {
    const cycle = markSlotSkipped(makeFreshCycle(3), 0, T0)
    expect(cycle[0]).toEqual({ status: 'skipped', completedAt: T0 })
  })
})

describe('resizeCycle', () => {
  it('returns the same cycle when length is unchanged', () => {
    const c = makeFreshCycle(5)
    expect(resizeCycle(c, 5)).toBe(c)
  })

  it('truncates when shrinking, preserving leading slot status', () => {
    let cycle = makeFreshCycle(5)
    cycle = markSlotDone(cycle, 0, 'l', T0)
    cycle = markSlotDone(cycle, 1, 'l2', T0)
    const result = resizeCycle(cycle, 3)
    expect(result).toHaveLength(3)
    expect(result[0].status).toBe('done')
    expect(result[1].status).toBe('done')
    expect(result[2].status).toBe('pending')
  })

  it('pads with pending slots when growing', () => {
    let cycle = makeFreshCycle(2)
    cycle = markSlotDone(cycle, 0, 'l', T0)
    const result = resizeCycle(cycle, 4)
    expect(result).toHaveLength(4)
    expect(result[0].status).toBe('done')
    expect(result[1].status).toBe('pending')
    expect(result[2].status).toBe('pending')
    expect(result[3].status).toBe('pending')
  })

  it('returns empty array for non-positive lengths', () => {
    expect(resizeCycle(makeFreshCycle(3), 0)).toEqual([])
    expect(resizeCycle(makeFreshCycle(3), -1)).toEqual([])
  })
})
