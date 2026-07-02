/**
 * CuePlayer — audio + haptic feedback for workout timers.
 *
 * Design goals:
 * - Testable via injected deps (no real AudioContext needed in tests).
 * - AudioContext created lazily; `unlock()` must be called on a user-gesture
 *   tap so iOS Safari allows audio playback.
 * - No-op when `navigator.vibrate` is absent (most desktops).
 */

export type VibratePatternFn = (pattern: VibratePattern) => boolean

export interface CuePlayerOptions {
  /** Injected for testing — returns a fake AudioContext or null. */
  createAudioContext?: () => AudioContext | null
  /** Injected for testing — replaces navigator.vibrate. */
  triggerVibrate?: VibratePatternFn
}

interface Tone {
  frequency: number // Hz
  duration: number // seconds
}

// Short tick for 3 / 2 / 1.
const TICK_TONE: Tone = { frequency: 880, duration: 0.12 }
// Distinct end tone at 0.
const END_TONE: Tone = { frequency: 1320, duration: 0.45 }

export class CuePlayer {
  private ctx: AudioContext | null = null
  private readonly opts: Required<CuePlayerOptions>

  constructor(options: CuePlayerOptions = {}) {
    this.opts = {
      createAudioContext:
        options.createAudioContext ??
        (() => {
          try {
            return new AudioContext()
          } catch {
            return null
          }
        }),
      triggerVibrate:
        options.triggerVibrate ??
        ((pattern) => {
          try {
            return navigator.vibrate?.(pattern) ?? false
          } catch {
            return false
          }
        }),
    }
  }

  /**
   * Create and/or resume the AudioContext.
   * MUST be called from within a user-gesture handler (e.g. the Start tap)
   * so iOS Safari allows audio output.
   */
  unlock(): void {
    if (!this.ctx) {
      this.ctx = this.opts.createAudioContext()
    }
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
  }

  /**
   * Fire the cue appropriate for `secondsRemaining`:
   *   3 / 2 / 1  → short tick beep + light haptic
   *   0           → distinct end tone + strong haptic
   *   anything else → no-op
   */
  cue(secondsRemaining: number): void {
    if (secondsRemaining === 3 || secondsRemaining === 2 || secondsRemaining === 1) {
      this.playTone(TICK_TONE)
      this.opts.triggerVibrate([30])
    } else if (secondsRemaining === 0) {
      this.playTone(END_TONE)
      this.opts.triggerVibrate([80, 40, 80])
    }
  }

  /** Release the AudioContext. Call on component unmount. */
  dispose(): void {
    this.ctx?.close().catch(() => {})
    this.ctx = null
  }

  private playTone(tone: Tone): void {
    if (!this.ctx) return
    try {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.frequency.value = tone.frequency
      osc.type = 'sine'
      const t = this.ctx.currentTime
      gain.gain.setValueAtTime(0.4, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + tone.duration)
      osc.start(t)
      osc.stop(t + tone.duration)
    } catch {
      // Context may be closed or in an unrecoverable state — swallow silently.
    }
  }
}
