# Workout Reminders — Spike Findings & Decision

**Question (ticket #12):** can we remind the user of a scheduled workout, ideally
when the app is closed, without adding a backend?

## Findings

- **Background/push delivery requires a server.** The Web Push API needs a push
  service subscription plus a server (VAPID keys) to actually *send* the push.
  iOS Safari supports Web Push since 16.4 **only for home-screen-installed PWAs**,
  but it still needs a server to trigger delivery. There is no client-only way to
  push to a closed app.
- **Local scheduled notifications are not available on iOS.** The Notification
  Triggers API (`TimestampTrigger` / `showTrigger`) — which could schedule a
  future local notification — is experimental and unsupported in Safari/iOS. So
  "fire at 6pm even if the app is closed" is not achievable locally.
- **What *is* possible with no backend:** a local notification fired **while the
  app is open**, via `registration.showNotification()` (works with the existing
  Workbox `generateSW` service worker — no custom push handler needed).

## Decision

Given this app's hard **local-first, no-backend** constraint, ship the local-only
reminder and **defer true background push** until/unless a backend is explicitly
chosen (per the plan, that decision comes back to Ivan).

## What shipped (local-first)

- Settings toggle **"Workout reminders"** (default off); enabling it requests
  Notification permission.
- On app open, if enabled + permission granted + today has an unfinished
  scheduled workout (from the active program's current cycle slot) + not already
  reminded today, a local notification names today's workout.
- Pure decision logic in `src/lib/workout-reminder.ts` (`shouldSendReminder`,
  unit-tested); IO in `src/hooks/useWorkoutReminder.ts`; once-per-day dedupe via
  `localStorage`.

## If background reminders are wanted later

Requires adding a minimal push sender: switch the PWA to `injectManifest` to add
a `push` / `notificationclick` handler in the service worker, generate VAPID
keys, and stand up a small endpoint (or a scheduled serverless function) to send
the push on program-day mornings. This introduces the app's first backend — a
scope change to weigh deliberately.
