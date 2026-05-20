import type { CycleSlot } from '@/models/types'

// Pure helpers for the sequence-driven program cycle. The pointer is derived
// (not stored) so we can't get it out of sync with the array. Repositories
// wrap these around Dexie writes; UI calls them through hooks.

export function makeFreshCycle(length: number): CycleSlot[] {
  return Array.from({ length }, () => ({ status: 'pending' as const }))
}

export function getCurrentSlotIndex(cycle: CycleSlot[]): number | null {
  const idx = cycle.findIndex((s) => s.status === 'pending')
  return idx === -1 ? null : idx
}

export function isCycleComplete(cycle: CycleSlot[]): boolean {
  return cycle.length > 0 && cycle.every((s) => s.status !== 'pending')
}

export function markSlotDone(
  cycle: CycleSlot[],
  index: number,
  workoutLogId: string | undefined,
  now: number,
): CycleSlot[] {
  if (index < 0 || index >= cycle.length) return cycle
  return cycle.map((slot, i) =>
    i === index ? { status: 'done', completedAt: now, workoutLogId } : slot,
  )
}

export function markSlotSkipped(cycle: CycleSlot[], index: number, now: number): CycleSlot[] {
  if (index < 0 || index >= cycle.length) return cycle
  return cycle.map((slot, i) => (i === index ? { status: 'skipped', completedAt: now } : slot))
}

// Resize when the underlying program's day count changes (user edits program
// while a cycle is in flight). Preserves status of slots that still exist.
export function resizeCycle(cycle: CycleSlot[], newLength: number): CycleSlot[] {
  if (newLength <= 0) return []
  if (newLength === cycle.length) return cycle
  if (newLength < cycle.length) return cycle.slice(0, newLength)
  return [...cycle, ...makeFreshCycle(newLength - cycle.length)]
}

// Compare two unix-ms timestamps under the device's local timezone. "Today"
// for the Home screen means same local calendar date.
export function isSameLocalDay(a: number, b: number): boolean {
  const da = new Date(a)
  const db = new Date(b)
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  )
}
