import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CuePlayer, decideCue, type CuePlayerOptions, type CueSnapshot } from '../cue-player'

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

// ─── decideCue — the transition decision logic ───────────────────────────────

describe('decideCue', () => {
  function snap(overrides: Partial<CueSnapshot> = {}): CueSnapshot {
    return {
      phase: 'exercise',
      restRemaining: 0,
      exerciseRemaining: 0,
      exerciseMode: undefined,
      ...overrides,
    }
  }

  // ── time-mode END tone: the regression this test file guards ────────────────

  it('fires end tone on exercise(time) → adjust transition (the important cue)', () => {
    const prev = snap({ phase: 'exercise', exerciseRemaining: 1, exerciseMode: 'time' })
    const curr = snap({ phase: 'adjust', exerciseRemaining: 0, exerciseMode: 'time' })
    expect(decideCue(prev, curr)).toBe(0)
  })

  it('does NOT fire end tone on exercise(max) → adjust transition', () => {
    const prev = snap({ phase: 'exercise', exerciseMode: 'max' })
    const curr = snap({ phase: 'adjust', exerciseMode: 'max' })
    expect(decideCue(prev, curr)).toBeNull()
  })

  it('does NOT fire end tone on exercise(reps) → adjust transition', () => {
    const prev = snap({ phase: 'exercise', exerciseMode: 'reps' })
    const curr = snap({ phase: 'adjust', exerciseMode: 'reps' })
    expect(decideCue(prev, curr)).toBeNull()
  })

  // ── rest END tone ───────────────────────────────────────────────────────────

  it('fires end tone on resting → exercise transition', () => {
    const prev = snap({ phase: 'resting', restRemaining: 1 })
    const curr = snap({ phase: 'exercise', restRemaining: 0 })
    expect(decideCue(prev, curr)).toBe(0)
  })

  // ── rest countdown beeps ────────────────────────────────────────────────────

  it.each([3, 2, 1])('fires countdown tick %i during rest', (r) => {
    const prev = snap({ phase: 'resting', restRemaining: r + 1 })
    const curr = snap({ phase: 'resting', restRemaining: r })
    expect(decideCue(prev, curr)).toBe(r)
  })

  it('does not fire a rest tick above 3', () => {
    const prev = snap({ phase: 'resting', restRemaining: 5 })
    const curr = snap({ phase: 'resting', restRemaining: 4 })
    expect(decideCue(prev, curr)).toBeNull()
  })

  // ── time-mode exercise countdown beeps ──────────────────────────────────────

  it.each([3, 2, 1])('fires countdown tick %i during a time-mode hold', (r) => {
    const prev = snap({ phase: 'exercise', exerciseRemaining: r + 1, exerciseMode: 'time' })
    const curr = snap({ phase: 'exercise', exerciseRemaining: r, exerciseMode: 'time' })
    expect(decideCue(prev, curr)).toBe(r)
  })

  it('does not fire a hold tick when the timer was just armed (value increased)', () => {
    // Start of a new time-mode exercise: remaining jumps from 0 up to e.g. 30,
    // then a fresh entry may briefly read 3 on some path — must not beep unless
    // it actually counted DOWN to 3.
    const prev = snap({ phase: 'exercise', exerciseRemaining: 0, exerciseMode: 'time' })
    const curr = snap({ phase: 'exercise', exerciseRemaining: 3, exerciseMode: 'time' })
    expect(decideCue(prev, curr)).toBeNull()
  })

  it('does not fire a hold tick for max mode (count-up)', () => {
    const prev = snap({ phase: 'exercise', exerciseRemaining: 3, exerciseMode: 'max' })
    const curr = snap({ phase: 'exercise', exerciseRemaining: 2, exerciseMode: 'max' })
    expect(decideCue(prev, curr)).toBeNull()
  })

  it('does not fire a hold tick for reps mode', () => {
    const prev = snap({ phase: 'exercise', exerciseRemaining: 3, exerciseMode: 'reps' })
    const curr = snap({ phase: 'exercise', exerciseRemaining: 2, exerciseMode: 'reps' })
    expect(decideCue(prev, curr)).toBeNull()
  })

  // ── no-op steady states ─────────────────────────────────────────────────────

  it('returns null when nothing relevant changes (ready → ready)', () => {
    expect(decideCue(snap({ phase: 'ready' }), snap({ phase: 'ready' }))).toBeNull()
  })

  it('returns null on a normal reps exercise → adjust with no timer', () => {
    const prev = snap({ phase: 'exercise', exerciseMode: 'reps' })
    const curr = snap({ phase: 'adjust', exerciseMode: 'reps' })
    expect(decideCue(prev, curr)).toBeNull()
  })
})
