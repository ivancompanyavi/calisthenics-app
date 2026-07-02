import { describe, it, expect } from 'vitest'
import {
  computeWeeklyFamilySplit,
  computeFamilyShareWarnings,
  computeCrossDayDriftWarnings,
  FAMILY_SHARE_DRIFT_THRESHOLD_PP,
  CROSS_DAY_DRIFT_THRESHOLD_RATIO,
  TRAILING_WEEKS_DISPLAY,
  TRAILING_WEEKS_FOR_MEAN,
} from '../volume-balance'
import type { MovementFamily } from '@/models/types'

// ── Fixture factories ─────────────────────────────────────────────────────────

function makeSetLog(
  workoutLogId: string,
  movementId: string,
  opts: { skipped?: boolean; warmup?: boolean } = {},
) {
  return { workoutLogId, movementId, skipped: opts.skipped ?? false, warmup: opts.warmup }
}

function makeWorkoutLog(id: string, completedAt: number, workoutName = 'Test Workout') {
  return { id, workoutName, completedAt }
}

/** Produce a timestamp for the Monday of the current week + offsetDays. */
function thisMonday(offsetDays = 0): number {
  const now = new Date()
  now.setHours(12, 0, 0, 0)
  const dow = now.getDay() === 0 ? 6 : now.getDay() - 1
  now.setDate(now.getDate() - dow + offsetDays)
  return now.getTime()
}

/** Monday of "i weeks ago" relative to now (i=0 → current week). */
function mondayOf(weeksAgo: number): number {
  return thisMonday(-weeksAgo * 7)
}

// ── Constants sanity ──────────────────────────────────────────────────────────

describe('threshold constants', () => {
  it('FAMILY_SHARE_DRIFT_THRESHOLD_PP is 15', () => {
    expect(FAMILY_SHARE_DRIFT_THRESHOLD_PP).toBe(15)
  })
  it('CROSS_DAY_DRIFT_THRESHOLD_RATIO is 0.20', () => {
    expect(CROSS_DAY_DRIFT_THRESHOLD_RATIO).toBeCloseTo(0.2)
  })
  it('TRAILING_WEEKS_DISPLAY is 8', () => {
    expect(TRAILING_WEEKS_DISPLAY).toBe(8)
  })
  it('TRAILING_WEEKS_FOR_MEAN is 4', () => {
    expect(TRAILING_WEEKS_FOR_MEAN).toBe(4)
  })
})

// ── computeWeeklyFamilySplit ──────────────────────────────────────────────────

describe('computeWeeklyFamilySplit — basic structure', () => {
  it('returns exactly TRAILING_WEEKS_DISPLAY slots', () => {
    const splits = computeWeeklyFamilySplit([], [], new Map())
    expect(splits).toHaveLength(TRAILING_WEEKS_DISPLAY)
  })

  it('all slots start at zero when there are no set logs', () => {
    const splits = computeWeeklyFamilySplit([], [], new Map())
    for (const s of splits) {
      expect(s.total).toBe(0)
      expect(s.counts).toEqual({})
    }
  })

  it('last slot is the current ISO week', () => {
    const splits = computeWeeklyFamilySplit([], [], new Map())
    const last = splits[splits.length - 1]
    // weekStart should be the Monday of the current week
    const monday = new Date(thisMonday())
    const y = monday.getFullYear()
    const m = String(monday.getMonth() + 1).padStart(2, '0')
    const d = String(monday.getDate()).padStart(2, '0')
    expect(last.weekStart).toBe(`${y}-${m}-${d}`)
  })
})

describe('computeWeeklyFamilySplit — set counting', () => {
  const familyMap: Map<string, MovementFamily> = new Map([
    ['m-push', 'push'],
    ['m-pull', 'pull'],
    ['m-legs', 'legs'],
    ['m-core', 'core'],
  ])

  it('places a set into the correct week slot', () => {
    const logTs = mondayOf(0) + 60_000 // this week Monday + 1 min
    const wl = makeWorkoutLog('wl1', logTs)
    const sl = makeSetLog('wl1', 'm-push')
    const splits = computeWeeklyFamilySplit([sl], [wl], familyMap)
    const last = splits[splits.length - 1]
    expect(last.total).toBe(1)
    expect(last.counts.push).toBe(1)
  })

  it('places sets from different weeks into different slots', () => {
    const wl0 = makeWorkoutLog('wl0', mondayOf(0) + 3600_000)
    const wl1 = makeWorkoutLog('wl1', mondayOf(1) + 3600_000)
    const sets = [
      makeSetLog('wl0', 'm-push'),
      makeSetLog('wl0', 'm-push'),
      makeSetLog('wl1', 'm-pull'),
    ]
    const splits = computeWeeklyFamilySplit(sets, [wl0, wl1], familyMap)
    const currentWeek = splits[splits.length - 1]
    const prevWeek = splits[splits.length - 2]
    expect(currentWeek.counts.push).toBe(2)
    expect(prevWeek.counts.pull).toBe(1)
  })

  it('excludes skipped sets', () => {
    const wl = makeWorkoutLog('wl1', mondayOf(0) + 3600_000)
    const sets = [
      makeSetLog('wl1', 'm-push', { skipped: true }),
      makeSetLog('wl1', 'm-pull'),
    ]
    const splits = computeWeeklyFamilySplit(sets, [wl], familyMap)
    const last = splits[splits.length - 1]
    expect(last.total).toBe(1)
    expect(last.counts.push).toBeUndefined()
    expect(last.counts.pull).toBe(1)
  })

  it('excludes warmup sets (defensive future-flag check)', () => {
    const wl = makeWorkoutLog('wl1', mondayOf(0) + 3600_000)
    const sets = [
      makeSetLog('wl1', 'm-push', { warmup: true }),
      makeSetLog('wl1', 'm-pull'),
    ]
    const splits = computeWeeklyFamilySplit(sets, [wl], familyMap)
    const last = splits[splits.length - 1]
    expect(last.total).toBe(1)
    expect(last.counts.push).toBeUndefined()
    expect(last.counts.pull).toBe(1)
  })

  it('ignores movements with no family in the map', () => {
    const wl = makeWorkoutLog('wl1', mondayOf(0) + 3600_000)
    const sets = [makeSetLog('wl1', 'unknown-movement')]
    const splits = computeWeeklyFamilySplit(sets, [wl], familyMap)
    expect(splits[splits.length - 1].total).toBe(0)
  })

  it('ignores workout logs outside the 8-week window', () => {
    const oldTs = mondayOf(10) // 10 weeks ago — outside window
    const wl = makeWorkoutLog('wl-old', oldTs)
    const sl = makeSetLog('wl-old', 'm-push')
    const splits = computeWeeklyFamilySplit([sl], [wl], familyMap)
    expect(splits.every((s) => s.total === 0)).toBe(true)
  })

  it('accumulates multiple sets of the same family', () => {
    const wl = makeWorkoutLog('wl1', mondayOf(0) + 3600_000)
    const sets = Array.from({ length: 5 }, () => makeSetLog('wl1', 'm-legs'))
    const splits = computeWeeklyFamilySplit(sets, [wl], familyMap)
    expect(splits[splits.length - 1].counts.legs).toBe(5)
    expect(splits[splits.length - 1].total).toBe(5)
  })
})

// ── computeFamilyShareWarnings ────────────────────────────────────────────────

describe('computeFamilyShareWarnings', () => {
  /**
   * Build a synthetic split array.  `weekShares` is an array of objects like
   * { push: 50, pull: 50 } where values are percentages summing to 100.
   * Each week gets `total` sets distributed by these percentages.
   */
  function makeSplits(
    weekShares: Partial<Record<MovementFamily, number>>[],
    total = 10,
  ) {
    return weekShares.map((shares, i) => {
      const counts: Partial<Record<MovementFamily, number>> = {}
      let rowTotal = 0
      for (const [f, pct] of Object.entries(shares) as [MovementFamily, number][]) {
        const n = Math.round((pct / 100) * total)
        if (n > 0) counts[f] = n
        rowTotal += n
      }
      return {
        weekStart: `2025-01-${String(i + 1).padStart(2, '0')}`,
        weekLabel: `1/${i + 1}`,
        counts,
        total: rowTotal,
      }
    })
  }

  it('emits no warning when current week is within threshold', () => {
    // Prior 4 weeks: 50/50 push/pull. Current week: 45/55 — only 5pp deviation.
    const splits = makeSplits([
      { push: 50, pull: 50 },
      { push: 50, pull: 50 },
      { push: 50, pull: 50 },
      { push: 50, pull: 50 },
      { push: 45, pull: 55 }, // current week — 5pp shift, below threshold
    ])
    expect(computeFamilyShareWarnings(splits)).toHaveLength(0)
  })

  it('fires a warning when current push share drops > 15pp below trailing mean', () => {
    // Prior 4 weeks: 50% push. Current week: 10% push → 40pp deviation.
    const splits = makeSplits([
      { push: 50, pull: 50 },
      { push: 50, pull: 50 },
      { push: 50, pull: 50 },
      { push: 50, pull: 50 },
      { push: 10, pull: 90 }, // current: push collapsed
    ])
    const warnings = computeFamilyShareWarnings(splits)
    expect(warnings.some((w) => w.kind === 'family-share' && w.family === 'push')).toBe(true)
    const pushWarning = warnings.find((w) => w.kind === 'family-share' && w.family === 'push')
    expect(pushWarning?.deviationPP).toBeGreaterThan(FAMILY_SHARE_DRIFT_THRESHOLD_PP)
  })

  it('fires a warning when a family share spikes > 15pp above trailing mean', () => {
    // Prior 4 weeks: legs at ~0%. Current week: legs at 40%.
    const splits = makeSplits([
      { push: 50, pull: 50 },
      { push: 50, pull: 50 },
      { push: 50, pull: 50 },
      { push: 50, pull: 50 },
      { push: 30, pull: 30, legs: 40 }, // current: legs spike
    ])
    const warnings = computeFamilyShareWarnings(splits)
    expect(warnings.some((w) => w.kind === 'family-share' && w.family === 'legs')).toBe(true)
  })

  it('warning text is human-readable and mentions the family', () => {
    const splits = makeSplits([
      { push: 50, pull: 50 },
      { push: 50, pull: 50 },
      { push: 50, pull: 50 },
      { push: 50, pull: 50 },
      { push: 10, pull: 90 },
    ])
    const warnings = computeFamilyShareWarnings(splits)
    const pushWarning = warnings.find((w) => w.kind === 'family-share' && w.family === 'push')!
    expect(pushWarning.text).toMatch(/push/i)
    expect(pushWarning.text).toMatch(/lower/)
  })

  it('does not warn on families that have no sets in either period', () => {
    // core never appears — should not produce a spurious 0 vs 0 warning
    const splits = makeSplits([
      { push: 50, pull: 50 },
      { push: 50, pull: 50 },
      { push: 50, pull: 50 },
      { push: 50, pull: 50 },
      { push: 50, pull: 50 },
    ])
    const warnings = computeFamilyShareWarnings(splits)
    expect(warnings.some((w) => w.kind === 'family-share' && w.family === 'core')).toBe(false)
  })

  it('returns empty when current week has no sets', () => {
    const splits = makeSplits([
      { push: 50, pull: 50 },
      { push: 50, pull: 50 },
      { push: 50, pull: 50 },
      { push: 50, pull: 50 },
      {}, // current week — no sets
    ], 0)
    expect(computeFamilyShareWarnings(splits)).toHaveLength(0)
  })

  it('returns empty when fewer than 2 weeks of data', () => {
    const splits = makeSplits([{ push: 50, pull: 50 }])
    expect(computeFamilyShareWarnings(splits)).toHaveLength(0)
  })

  it('does not fire when deviation is exactly at the threshold', () => {
    // Prior mean = 50% push. Current = 35% push → deviation = 15pp exactly.
    // Threshold is STRICT (>), so exactly 15pp should NOT warn.
    const splits = makeSplits([
      { push: 50, pull: 50 },
      { push: 50, pull: 50 },
      { push: 50, pull: 50 },
      { push: 50, pull: 50 },
      // 3 push out of 6 = 50%; need 2 out of 6 ≈ 33% to get ~17pp deviation.
      // Let's use a direct total-controlled approach:
    ])
    // Manually override the last slot for a precise 35/65 split
    splits[splits.length - 1] = {
      weekStart: '2025-01-06',
      weekLabel: '1/6',
      counts: { push: 35, pull: 65 },
      total: 100,
    }
    // Prior weeks also need total = 100 for 50/50 to compute correctly
    for (let i = 0; i < splits.length - 1; i++) {
      splits[i] = {
        ...splits[i],
        counts: { push: 50, pull: 50 },
        total: 100,
      }
    }
    const warnings = computeFamilyShareWarnings(splits)
    const pushWarning = warnings.find((w) => w.kind === 'family-share' && w.family === 'push')
    // 35% vs 50% mean = exactly 15pp — must NOT warn (strict >)
    expect(pushWarning).toBeUndefined()
  })
})

// ── computeCrossDayDriftWarnings ──────────────────────────────────────────────

describe('computeCrossDayDriftWarnings', () => {
  const familyMap: Map<string, MovementFamily> = new Map([
    ['m-pull', 'pull'],
    ['m-push', 'push'],
    ['m-legs', 'legs'],
    ['m-core', 'core'],
  ])

  it('fires when > 20% of sets are off-dominant family', () => {
    // 7 pull sets + 3 leg sets = 30% off-dominant (legs in a pull workout)
    const wl = makeWorkoutLog('wl1', mondayOf(0) + 3600_000, 'Pull A')
    const sets = [
      ...Array.from({ length: 7 }, () => makeSetLog('wl1', 'm-pull')),
      ...Array.from({ length: 3 }, () => makeSetLog('wl1', 'm-legs')),
    ]
    const warnings = computeCrossDayDriftWarnings(sets, [wl], familyMap)
    expect(warnings).toHaveLength(1)
    expect(warnings[0].kind).toBe('cross-day-drift')
    expect(warnings[0].workoutName).toBe('Pull A')
    expect(warnings[0].dominantFamily).toBe('pull')
    expect(warnings[0].driftRatio).toBeCloseTo(0.3)
  })

  it('does not fire when off-family sets are at or below 20%', () => {
    // 8 pull sets + 2 leg sets = 20% off-dominant (exactly at threshold → no warn)
    const wl = makeWorkoutLog('wl1', mondayOf(0) + 3600_000, 'Pull A')
    const sets = [
      ...Array.from({ length: 8 }, () => makeSetLog('wl1', 'm-pull')),
      ...Array.from({ length: 2 }, () => makeSetLog('wl1', 'm-legs')),
    ]
    const warnings = computeCrossDayDriftWarnings(sets, [wl], familyMap)
    expect(warnings).toHaveLength(0)
  })

  it('does not fire for a pure single-family workout', () => {
    const wl = makeWorkoutLog('wl1', mondayOf(0) + 3600_000, 'Push A')
    const sets = Array.from({ length: 10 }, () => makeSetLog('wl1', 'm-push'))
    const warnings = computeCrossDayDriftWarnings(sets, [wl], familyMap)
    expect(warnings).toHaveLength(0)
  })

  it('warning text is human-readable and mentions the workout name', () => {
    const wl = makeWorkoutLog('wl1', mondayOf(0) + 3600_000, 'Pull A')
    const sets = [
      ...Array.from({ length: 7 }, () => makeSetLog('wl1', 'm-pull')),
      ...Array.from({ length: 3 }, () => makeSetLog('wl1', 'm-legs')),
    ]
    const [w] = computeCrossDayDriftWarnings(sets, [wl], familyMap)
    expect(w.text).toMatch(/Pull A/)
    expect(w.text).toMatch(/30%/)
  })

  it('excludes skipped sets from dominant-family calculation', () => {
    // 3 pull sets (active) + 7 skipped pull sets + 3 legs sets
    // Without skipped: 3 pull vs 3 legs → 50% off-dominant (tie broken to push
    // order, so dominant is first in FAMILIES order — but actually if tied,
    // legs would not be dominant). Let's make it unambiguous:
    // 4 pull (active) + 3 legs (active) + lots of skipped pull
    // dominant = pull (4), off = 3/7 ≈ 43% → should warn
    const wl = makeWorkoutLog('wl1', mondayOf(0) + 3600_000, 'Pull A')
    const sets = [
      ...Array.from({ length: 4 }, () => makeSetLog('wl1', 'm-pull')),
      ...Array.from({ length: 3 }, () => makeSetLog('wl1', 'm-legs')),
      ...Array.from({ length: 10 }, () => makeSetLog('wl1', 'm-pull', { skipped: true })),
    ]
    const warnings = computeCrossDayDriftWarnings(sets, [wl], familyMap)
    expect(warnings).toHaveLength(1)
    expect(warnings[0].driftRatio).toBeCloseTo(3 / 7)
  })

  it('ignores workouts outside the trailing-8-week window', () => {
    const oldTs = mondayOf(10) // 10 weeks ago — outside window
    const wl = makeWorkoutLog('wl-old', oldTs, 'Old Workout')
    const sets = [
      ...Array.from({ length: 7 }, () => makeSetLog('wl-old', 'm-pull')),
      ...Array.from({ length: 3 }, () => makeSetLog('wl-old', 'm-legs')),
    ]
    const warnings = computeCrossDayDriftWarnings(sets, [wl], familyMap)
    expect(warnings).toHaveLength(0)
  })

  it('can emit multiple warnings for multiple offending workouts', () => {
    const wl1 = makeWorkoutLog('wl1', mondayOf(0) + 3600_000, 'Pull A')
    const wl2 = makeWorkoutLog('wl2', mondayOf(1) + 3600_000, 'Push A')
    const sets = [
      ...Array.from({ length: 7 }, () => makeSetLog('wl1', 'm-pull')),
      ...Array.from({ length: 3 }, () => makeSetLog('wl1', 'm-legs')),
      ...Array.from({ length: 7 }, () => makeSetLog('wl2', 'm-push')),
      ...Array.from({ length: 3 }, () => makeSetLog('wl2', 'm-legs')),
    ]
    const warnings = computeCrossDayDriftWarnings(sets, [wl1, wl2], familyMap)
    expect(warnings).toHaveLength(2)
  })

  it('ignores movements with no family in the map', () => {
    // All sets for an unknown movement — no counted sets → no warning
    const wl = makeWorkoutLog('wl1', mondayOf(0) + 3600_000, 'Mystery Workout')
    const sets = Array.from({ length: 10 }, () => makeSetLog('wl1', 'unknown'))
    const warnings = computeCrossDayDriftWarnings(sets, [wl], familyMap)
    expect(warnings).toHaveLength(0)
  })

  it('fires at exactly 21% (just above threshold)', () => {
    // 79 pull + 21 legs = 21% off-dominant → should warn
    const wl = makeWorkoutLog('wl1', mondayOf(0) + 3600_000, 'Pull A')
    const sets = [
      ...Array.from({ length: 79 }, () => makeSetLog('wl1', 'm-pull')),
      ...Array.from({ length: 21 }, () => makeSetLog('wl1', 'm-legs')),
    ]
    const warnings = computeCrossDayDriftWarnings(sets, [wl], familyMap)
    expect(warnings).toHaveLength(1)
  })
})
