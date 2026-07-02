import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CuePlayer, type CuePlayerOptions } from '../cue-player'

// ── Minimal fake AudioContext ─────────────────────────────────────────────────

function makeFakeOscillator() {
  return {
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    frequency: { value: 0 },
    type: 'sine' as OscillatorType,
  }
}

function makeFakeGain() {
  return {
    connect: vi.fn(),
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
  }
}

function makeFakeContext(state: AudioContextState = 'running') {
  const osc = makeFakeOscillator()
  const gain = makeFakeGain()
  const ctx = {
    state,
    currentTime: 0,
    destination: {},
    createOscillator: vi.fn().mockReturnValue(osc),
    createGain: vi.fn().mockReturnValue(gain),
    resume: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    _osc: osc,
    _gain: gain,
  }
  return ctx
}

// ─────────────────────────────────────────────────────────────────────────────

describe('CuePlayer', () => {
  let fakeCtx: ReturnType<typeof makeFakeContext>
  let vibrateSpy: ReturnType<typeof vi.fn>
  let player: CuePlayer

  beforeEach(() => {
    fakeCtx = makeFakeContext('running')
    vibrateSpy = vi.fn().mockReturnValue(true)
    player = new CuePlayer({
      createAudioContext: () => fakeCtx as unknown as AudioContext,
      triggerVibrate: vibrateSpy as unknown as CuePlayerOptions['triggerVibrate'],
    })
  })

  // ── unlock ──────────────────────────────────────────────────────────────────

  describe('unlock()', () => {
    it('creates the AudioContext on first call', () => {
      const createSpy = vi.fn().mockReturnValue(fakeCtx)
      const p = new CuePlayer({ createAudioContext: createSpy })
      expect(createSpy).not.toHaveBeenCalled()
      p.unlock()
      expect(createSpy).toHaveBeenCalledTimes(1)
    })

    it('does not create a second context on repeated calls', () => {
      const createSpy = vi.fn().mockReturnValue(fakeCtx)
      const p = new CuePlayer({ createAudioContext: createSpy })
      p.unlock()
      p.unlock()
      expect(createSpy).toHaveBeenCalledTimes(1)
    })

    it('resumes a suspended context', () => {
      const suspendedCtx = makeFakeContext('suspended')
      const p = new CuePlayer({
        createAudioContext: () => suspendedCtx as unknown as AudioContext,
      })
      p.unlock()
      expect(suspendedCtx.resume).toHaveBeenCalled()
    })

    it('does not call resume on a running context', () => {
      player.unlock()
      expect(fakeCtx.resume).not.toHaveBeenCalled()
    })
  })

  // ── cue — no-op cases ───────────────────────────────────────────────────────

  describe('cue() — no-op for non-cue seconds', () => {
    it('does nothing for seconds above 3', () => {
      player.unlock()
      player.cue(10)
      player.cue(4)
      expect(fakeCtx.createOscillator).not.toHaveBeenCalled()
      expect(vibrateSpy).not.toHaveBeenCalled()
    })

    it('does nothing for negative seconds', () => {
      player.unlock()
      player.cue(-1)
      expect(fakeCtx.createOscillator).not.toHaveBeenCalled()
    })

    it('does nothing before unlock (no context)', () => {
      // No unlock call — context is null.
      player.cue(3)
      // createOscillator should never be reached since ctx is null.
      expect(fakeCtx.createOscillator).not.toHaveBeenCalled()
      // vibrate is still called since it doesn't depend on ctx.
      expect(vibrateSpy).toHaveBeenCalledWith([30])
    })
  })

  // ── cue — tick beeps at 3 / 2 / 1 ─────────────────────────────────────────

  describe('cue(3 / 2 / 1) — tick beep', () => {
    beforeEach(() => {
      player.unlock()
    })

    it.each([3, 2, 1])('plays a tone for second %i', (s) => {
      player.cue(s)
      expect(fakeCtx.createOscillator).toHaveBeenCalledTimes(1)
      expect(fakeCtx._osc.start).toHaveBeenCalledTimes(1)
      expect(fakeCtx._osc.stop).toHaveBeenCalledTimes(1)
    })

    it.each([3, 2, 1])('vibrates with light pattern for second %i', (s) => {
      player.cue(s)
      expect(vibrateSpy).toHaveBeenCalledWith([30])
    })

    it('uses the tick frequency (880 Hz)', () => {
      player.cue(1)
      expect(fakeCtx._osc.frequency.value).toBe(880)
    })
  })

  // ── cue — end tone at 0 ────────────────────────────────────────────────────

  describe('cue(0) — end tone', () => {
    beforeEach(() => {
      player.unlock()
    })

    it('plays a tone', () => {
      player.cue(0)
      expect(fakeCtx.createOscillator).toHaveBeenCalledTimes(1)
      expect(fakeCtx._osc.start).toHaveBeenCalledTimes(1)
      expect(fakeCtx._osc.stop).toHaveBeenCalledTimes(1)
    })

    it('vibrates with strong pattern', () => {
      player.cue(0)
      expect(vibrateSpy).toHaveBeenCalledWith([80, 40, 80])
    })

    it('uses a higher frequency than tick beeps (1320 Hz)', () => {
      player.cue(0)
      expect(fakeCtx._osc.frequency.value).toBe(1320)
    })

    it('uses a longer duration than tick beeps', () => {
      // Longer stop time relative to start (duration > 0.12 s for tick).
      // We verify stop is called with a later time than start.
      player.cue(0) // end tone
      const stopArg0 = fakeCtx._osc.stop.mock.calls[0][0] as number

      fakeCtx = makeFakeContext('running')
      const p2 = new CuePlayer({
        createAudioContext: () => fakeCtx as unknown as AudioContext,
        triggerVibrate: vi.fn(),
      })
      p2.unlock()
      p2.cue(1) // tick beep
      const stopArg1 = fakeCtx._osc.stop.mock.calls[0][0] as number

      expect(stopArg0).toBeGreaterThan(stopArg1)
    })
  })

  // ── dispose ─────────────────────────────────────────────────────────────────

  describe('dispose()', () => {
    it('closes the AudioContext', () => {
      player.unlock()
      player.dispose()
      expect(fakeCtx.close).toHaveBeenCalled()
    })

    it('is safe to call without prior unlock', () => {
      expect(() => player.dispose()).not.toThrow()
    })

    it('is safe to call twice', () => {
      player.unlock()
      player.dispose()
      expect(() => player.dispose()).not.toThrow()
    })
  })

  // ── graceful degradation ────────────────────────────────────────────────────

  describe('graceful degradation', () => {
    it('handles null AudioContext from factory without throwing', () => {
      const p = new CuePlayer({
        createAudioContext: () => null,
        triggerVibrate: vibrateSpy as unknown as CuePlayerOptions['triggerVibrate'],
      })
      p.unlock()
      expect(() => p.cue(3)).not.toThrow()
      expect(() => p.cue(0)).not.toThrow()
    })

    it('still vibrates when AudioContext is null', () => {
      const vib = vi.fn().mockReturnValue(false)
      const p = new CuePlayer({
        createAudioContext: () => null,
        triggerVibrate: vib as unknown as CuePlayerOptions['triggerVibrate'],
      })
      p.unlock()
      p.cue(3)
      expect(vib).toHaveBeenCalledWith([30])
    })

    it('handles createOscillator throwing without propagating', () => {
      fakeCtx.createOscillator.mockImplementation(() => {
        throw new Error('AudioContext error')
      })
      player.unlock()
      expect(() => player.cue(3)).not.toThrow()
    })
  })
})
