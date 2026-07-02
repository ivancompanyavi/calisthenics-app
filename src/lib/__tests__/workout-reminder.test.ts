import { describe, it, expect } from 'vitest'
import { shouldSendReminder, type ReminderInput } from '../workout-reminder'

function base(overrides: Partial<ReminderInput> = {}): ReminderInput {
  return {
    enabled: true,
    permission: 'granted',
    hasPendingWorkout: true,
    lastNotifiedDate: null,
    todayKey: '2026-07-02',
    ...overrides,
  }
}

describe('shouldSendReminder', () => {
  it('sends when enabled, granted, pending workout, not yet notified today', () => {
    expect(shouldSendReminder(base())).toBe(true)
  })

  it('does not send when disabled', () => {
    expect(shouldSendReminder(base({ enabled: false }))).toBe(false)
  })

  it('does not send without notification permission', () => {
    expect(shouldSendReminder(base({ permission: 'default' }))).toBe(false)
    expect(shouldSendReminder(base({ permission: 'denied' }))).toBe(false)
  })

  it('does not send when no pending workout (rest day / already done / none scheduled)', () => {
    expect(shouldSendReminder(base({ hasPendingWorkout: false }))).toBe(false)
  })

  it('does not send twice on the same day', () => {
    expect(shouldSendReminder(base({ lastNotifiedDate: '2026-07-02' }))).toBe(false)
  })

  it('sends again on a new day', () => {
    expect(shouldSendReminder(base({ lastNotifiedDate: '2026-07-01' }))).toBe(true)
  })
})
