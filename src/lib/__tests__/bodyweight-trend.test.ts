import { describe, expect, it } from 'vitest'
import { analyzeBodyweightTrend } from '@/lib/bodyweight-trend'
import type { BodyweightLog } from '@/models/types'

const DAY = 24 * 60 * 60 * 1000
const NOW = 1_750_000_000_000

function log(daysAgo: number, kg: number, id = `l${daysAgo}`): BodyweightLog {
  return { id, date: NOW - daysAgo * DAY, kg }
}

describe('analyzeBodyweightTrend', () => {
  it('returns null when there are no logs', () => {
    expect(analyzeBodyweightTrend([], NOW)).toBeNull()
  })

  it('returns null with a single log (no comparison possible)', () => {
    expect(analyzeBodyweightTrend([log(0, 75)], NOW)).toBeNull()
  })

  it('flags a 3-week uptrend when the latest is ≥ 0.5 kg heavier than ~21 days ago', () => {
    // 3 entries keeps us under the extreme-rule threshold so the trend rule
    // is the only one that can match.
    const logs = [log(0, 76.2), log(14, 75.8), log(21, 75.0)]
    const result = analyzeBodyweightTrend(logs, NOW)
    expect(result?.kind).toBe('trend-up')
    if (result?.kind === 'trend-up') {
      expect(result.deltaKg).toBeCloseTo(1.2, 6)
      expect(result.windowDays).toBe(21)
    }
  })

  it('flags a 3-week downtrend when the latest is ≥ 0.5 kg lighter', () => {
    const logs = [log(0, 74.5), log(14, 75.3), log(21, 75.5)]
    const result = analyzeBodyweightTrend(logs, NOW)
    expect(result?.kind).toBe('trend-down')
    if (result?.kind === 'trend-down') {
      expect(result.deltaKg).toBeCloseTo(1.0, 6)
    }
  })

  it('skips the trend annotation when the move is below the noise floor', () => {
    const logs = [log(0, 75.2), log(21, 75.0)]
    expect(analyzeBodyweightTrend(logs, NOW)).toBeNull()
  })

  it('flags a 6-week extreme-high when latest is the maximum in window', () => {
    // 5 readings spanning the 6-week window; the most recent is the heaviest.
    const logs = [
      log(0, 78.0),
      log(7, 76.5),
      log(14, 76.0),
      log(21, 75.5),
      log(28, 75.5),
    ]
    expect(analyzeBodyweightTrend(logs, NOW)).toEqual({
      kind: 'extreme-high',
      kg: 78.0,
      windowDays: 42,
    })
  })

  it('flags a 6-week extreme-low when latest is the minimum in window', () => {
    const logs = [
      log(0, 73.0),
      log(7, 74.0),
      log(14, 75.0),
      log(21, 75.5),
      log(28, 75.0),
    ]
    expect(analyzeBodyweightTrend(logs, NOW)).toEqual({
      kind: 'extreme-low',
      kg: 73.0,
      windowDays: 42,
    })
  })

  it('prefers extreme over trend when both apply', () => {
    // Latest is also the lowest in the 6w window AND down vs 3 weeks ago.
    const logs = [
      log(0, 73.0),
      log(7, 74.0),
      log(14, 74.5),
      log(21, 75.0),
      log(28, 75.0),
    ]
    expect(analyzeBodyweightTrend(logs, NOW)?.kind).toBe('extreme-low')
  })

  it('does not flag an extreme without enough readings in the window', () => {
    // Only 3 entries — needs ≥ 4 to trust "highest in 6 weeks".
    const logs = [log(0, 78), log(7, 76), log(14, 75)]
    // Trend should still fire though (>0.5kg over 3 weeks).
    const result = analyzeBodyweightTrend(logs, NOW)
    expect(result?.kind).toBe('trend-up')
  })

  it('does not flag a trend when the comparison entry is too far from the 21d target', () => {
    // Comparison entry is 45 days old — outside the ±10-day slack window.
    const logs = [log(0, 76.5), log(45, 75.0)]
    expect(analyzeBodyweightTrend(logs, NOW)).toBeNull()
  })

  it('treats max === min in the window as non-extreme (flat)', () => {
    const logs = [log(0, 75), log(7, 75), log(14, 75), log(21, 75)]
    expect(analyzeBodyweightTrend(logs, NOW)).toBeNull()
  })
})
