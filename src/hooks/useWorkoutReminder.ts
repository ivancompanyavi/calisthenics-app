import { useEffect } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { useCurrentSlot } from '@/hooks/usePrograms'
import { shouldSendReminder } from '@/lib/workout-reminder'
import { toLocalDateKey } from '@/lib/heatmap'

const LAST_NOTIFIED_KEY = 'workoutReminder:lastNotifiedDate'

/**
 * Fires a LOCAL notification when the app opens on a day that has an unfinished
 * scheduled workout. Local-first only — see docs/notifications-spike.md for why
 * background/push delivery is out of scope. Mounted once, near the app root.
 */
export function useWorkoutReminder(): void {
  const { data: settings } = useSettings()
  const { data: slot } = useCurrentSlot()

  useEffect(() => {
    if (!settings || !slot) return
    if (typeof Notification === 'undefined') return // unsupported browser

    const hasPendingWorkout =
      !!slot.pointerWorkoutId && !slot.pointerIsRestDay && !slot.didActivityToday
    const todayKey = toLocalDateKey(Date.now())

    const decision = shouldSendReminder({
      enabled: settings.workoutRemindersEnabled ?? false,
      permission: Notification.permission,
      hasPendingWorkout,
      lastNotifiedDate: localStorage.getItem(LAST_NOTIFIED_KEY),
      todayKey,
    })
    if (!decision) return

    // Prefer the service-worker registration (notification persists in the OS
    // notification center); fall back to a page Notification if unavailable.
    const title = 'Workout today'
    const body = `${slot.pointerWorkoutName ?? 'Your next workout'} is on your program today.`
    const options: NotificationOptions = {
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: 'workout-reminder',
    }

    const fire = async () => {
      try {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready
          await reg.showNotification(title, options)
        } else {
          new Notification(title, options)
        }
        localStorage.setItem(LAST_NOTIFIED_KEY, todayKey)
      } catch {
        // Notifications are best-effort; never let this break app startup.
      }
    }
    fire()
  }, [settings, slot])
}
