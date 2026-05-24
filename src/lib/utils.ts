import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { TempoSpec } from '@/models/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Format a TempoSpec as the canonical 4-digit notation "ecc-bottom-con-top",
// e.g. {3,1,1,0} → "3-1-1-0". A concentric of 0 is displayed literally; the
// "X" (max-speed concentric) convention is captured in coaching cues since
// the timer can't enforce explosive intent.
export function formatTempo(t: TempoSpec): string {
  return `${t.eccentric}-${t.bottomPause}-${t.concentric}-${t.topPause}`
}

export function generateId(): string {
  return crypto.randomUUID()
}
