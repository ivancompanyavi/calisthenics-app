// Pure decision logic for the local workout reminder. No DB / no browser APIs —
// the hook (useWorkoutReminder) supplies the current state and performs the IO.
//
// This is a LOCAL-first reminder: it can only fire while the app is open.
// True background/push delivery (app closed) requires a push server, which is
// intentionally out of scope — see docs/notifications-spike.md.

export interface ReminderInput {
  /** User setting: reminders turned on. */
  enabled: boolean
  /** Browser Notification permission state. */
  permission: NotificationPermission
  /** A non-rest workout is scheduled today and hasn't been done yet. */
  hasPendingWorkout: boolean
  /** Local date (YYYY-MM-DD) a reminder was last shown, or null. */
  lastNotifiedDate: string | null
  /** Today's local date (YYYY-MM-DD). */
  todayKey: string
}

/**
 * Decide whether to show a workout reminder now. True only when reminders are
 * enabled, permission is granted, there's an unfinished workout scheduled
 * today, and we haven't already reminded today (once-per-day dedupe).
 */
export function shouldSendReminder(input: ReminderInput): boolean {
  if (!input.enabled) return false
  if (input.permission !== 'granted') return false
  if (!input.hasPendingWorkout) return false
  if (input.lastNotifiedDate === input.todayKey) return false
  return true
}
