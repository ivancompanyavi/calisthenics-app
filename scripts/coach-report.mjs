#!/usr/bin/env node
// Computes a deterministic markdown training report from a calisthenics-tracker
// data export (see src/lib/data-transfer.ts, exportAllData() / EXPORT_VERSION 5).
//
// This script is READ-ONLY: it never writes to the snapshot or any other file.
// It is meant to be run against a snapshot.json pulled from the owner's
// private `calisthenics-data` mirror repo by the `training-coach` skill
// (.claude/skills/training-coach/SKILL.md) — see that file for the fetch
// commands. It does not itself talk to GitHub or contain any personal data.
//
// Usage:
//   node scripts/coach-report.mjs <snapshot.json> [coach-profile.md] [--json]
//
// Field names below are verified against src/models/types.ts and the actual
// export shape in src/lib/data-transfer.ts (exportAllData). Where this script
// makes a judgment call not spelled out by those files, it's called out in a
// comment nearby — see also the "Deviations" note at the bottom of this file.

import { readFileSync, existsSync } from 'node:fs'

const SUPPORTED_VERSIONS = [2, 3, 4, 5, 6]
const DAY_MS = 24 * 60 * 60 * 1000
const WEEK_MS = 7 * DAY_MS
const WEEKS_TO_SHOW = 8 // weekly set volume window
const RECENT_SESSIONS_FOR_TREND = 5 // "trend over last ~5 sessions"
const RECENT_WEEKS_FOR_SKIP_RATE = 4 // skip-rate + RIR "recent period" window
const NUTRITION_DAYS_TO_SHOW = 14 // daily totals table window
const NUTRITION_ROLLING_WINDOW_DAYS = 7 // rolling kcal/protein average + adherence window
const NUTRITION_TDEE_WINDOW_DAYS = 14 // trailing window for the adaptive TDEE estimate
// How many distinct logged days we require inside the TDEE window before we'll
// trust the average-kcal side of the estimate. ~70% of the window — sparse
// logging makes avgDailyKcal unreliable even if the elapsed-days span is long enough.
const NUTRITION_TDEE_MIN_LOGGED_DAYS = 10
const KCAL_PER_KG = 7700 // standard energy-density-of-fat approximation used for the TDEE estimate
// Mirrors the default in src/lib/progression-metrics.ts (sessionQualifies /
// countGateFailures use `criteria.minRIR ?? 2`). This script does NOT read
// per-level ExitCriteria overrides — it summarizes with the global default
// only, per the instruction to mirror the spirit of readiness-engine.ts
// without duplicating its full logic.
const READINESS_MIN_RIR = 2

// ───────────────────────── CLI ─────────────────────────

function usage() {
  console.error(
    'Usage: node scripts/coach-report.mjs <snapshot.json> [coach-profile.md] [--json]',
  )
}

function parseArgs(argv) {
  const jsonFlag = argv.includes('--json')
  const positional = argv.filter((a) => a !== '--json')
  const [snapshotPath, profilePath] = positional
  return { snapshotPath, profilePath, jsonFlag }
}

function loadSnapshot(path) {
  if (!existsSync(path)) {
    console.error(`snapshot not found: ${path}`)
    process.exit(1)
  }
  let parsed
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'))
  } catch (e) {
    console.error(`snapshot is not valid JSON: ${e.message}`)
    process.exit(1)
  }
  if (typeof parsed !== 'object' || parsed === null) {
    console.error('snapshot must be a JSON object')
    process.exit(1)
  }
  if (typeof parsed.version !== 'number' || !SUPPORTED_VERSIONS.includes(parsed.version)) {
    console.error(
      `warning: unrecognized snapshot version ${JSON.stringify(parsed.version)} ` +
        `(supported: ${SUPPORTED_VERSIONS.join(', ')}) — proceeding best-effort`,
    )
  }
  return parsed
}

// ───────────────────────── time helpers ─────────────────────────

function startOfWeekUTC(ts) {
  const d = new Date(ts)
  const day = d.getUTCDay() // 0 = Sun .. 6 = Sat
  const diffToMonday = (day + 6) % 7
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - diffToMonday)
}

function isoDate(ts) {
  return new Date(ts).toISOString().slice(0, 10)
}

function startOfDayUTC(ts) {
  const d = new Date(ts)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

// ───────────────────────── indexing ─────────────────────────

function buildIndices(snapshot) {
  const movements = Array.isArray(snapshot.movements) ? snapshot.movements : []
  const progressions = Array.isArray(snapshot.progressions) ? snapshot.progressions : []
  const progressionLevels = Array.isArray(snapshot.progressionLevels) ? snapshot.progressionLevels : []
  const workoutLogs = Array.isArray(snapshot.workoutLogs) ? snapshot.workoutLogs : []
  const setLogs = Array.isArray(snapshot.setLogs) ? snapshot.setLogs : []
  const bodyweightLogs = Array.isArray(snapshot.bodyweightLogs) ? snapshot.bodyweightLogs : []
  const customFoods = Array.isArray(snapshot.customFoods) ? snapshot.customFoods : []
  const foodLogs = Array.isArray(snapshot.foodLogs) ? snapshot.foodLogs : []
  const measurements = Array.isArray(snapshot.measurements) ? snapshot.measurements : []
  const nutritionTargets = Array.isArray(snapshot.nutritionTargets) ? snapshot.nutritionTargets : []

  const movementById = new Map(movements.map((m) => [m.id, m]))
  const workoutLogById = new Map(workoutLogs.map((w) => [w.id, w]))

  const levelsByProgression = new Map()
  for (const lvl of progressionLevels) {
    const arr = levelsByProgression.get(lvl.progressionId) ?? []
    arr.push(lvl)
    levelsByProgression.set(lvl.progressionId, arr)
  }
  // Same convention as src/repositories/progressions.repository.ts: sort each
  // progression's levels by `order`, then index into that array with
  // Progression.currentLevel (array-index lookup, not `order === currentLevel`).
  for (const arr of levelsByProgression.values()) arr.sort((a, b) => a.order - b.order)

  return {
    movements,
    progressions,
    progressionLevels,
    workoutLogs,
    setLogs,
    bodyweightLogs,
    customFoods,
    foodLogs,
    measurements,
    nutritionTargets,
    movementById,
    workoutLogById,
    levelsByProgression,
  }
}

// A set counts toward volume / PR / readiness analytics only when it was
// actually performed and isn't part of the auto-generated warm-up pre-block.
// See SetLog.warmup in src/models/types.ts: "must be excluded from PR
// derivation, progression readiness metrics, and volume accounting."
function isCountable(set) {
  return !set.skipped && !set.warmup
}

// ───────────────────────── weekly set volume ─────────────────────────

function computeWeeklyVolume(idx, now) {
  const currentWeekStart = startOfWeekUTC(now)
  const buckets = []
  for (let i = WEEKS_TO_SHOW - 1; i >= 0; i--) {
    buckets.push({ weekStart: currentWeekStart - i * WEEK_MS, sets: 0 })
  }
  const bucketByStart = new Map(buckets.map((b) => [b.weekStart, b]))
  const oldestStart = buckets[0].weekStart

  for (const set of idx.setLogs) {
    if (!isCountable(set)) continue
    const log = idx.workoutLogById.get(set.workoutLogId)
    if (!log || typeof log.completedAt !== 'number') continue
    if (log.completedAt < oldestStart) continue
    const bucket = bucketByStart.get(startOfWeekUTC(log.completedAt))
    if (bucket) bucket.sets++
  }

  return buckets.map((b) => ({ weekStart: isoDate(b.weekStart), sets: b.sets }))
}

// ───────────────────────── per-progression status ─────────────────────────

// Numeric value a set contributes for "best set" / trend purposes, by mode.
function setValue(mode, set) {
  if (mode === 'reps') return set.actualReps ?? null
  return set.actualSeconds ?? null
}

// Sessions for one progression's *current rung* (movementId at currentLevel),
// grouped by workoutLogId and ordered oldest → newest. Mirrors
// progressions.repository.ts#getVerdicts session-history derivation.
function rungSessions(idx, progression, currentMovementId) {
  const relevant = idx.setLogs.filter(
    (s) => s.progressionId === progression.id && s.movementId === currentMovementId && isCountable(s),
  )
  const byLog = new Map()
  for (const s of relevant) {
    const arr = byLog.get(s.workoutLogId) ?? []
    arr.push(s)
    byLog.set(s.workoutLogId, arr)
  }
  const sortedIds = [...byLog.keys()].sort((a, b) => {
    const ta = idx.workoutLogById.get(a)?.completedAt ?? 0
    const tb = idx.workoutLogById.get(b)?.completedAt ?? 0
    return ta - tb
  })
  return sortedIds.map((id) => ({
    workoutLogId: id,
    completedAt: idx.workoutLogById.get(id)?.completedAt ?? null,
    sets: byLog.get(id),
  }))
}

// Simple, deterministic trend heuristic over a session's best-set values:
// compares the first vs. last available value. This intentionally does NOT
// reproduce readiness-engine.ts's full qualifying-streak/gate logic — it's a
// coarse summary signal only, per the task's "mirror the spirit, don't
// duplicate" instruction.
function computeTrend(bestValues) {
  const known = bestValues.filter((v) => v != null)
  if (known.length < 2) return 'insufficient-data'
  const first = known[0]
  const last = known[known.length - 1]
  if (last > first) return 'improving'
  if (last < first) return 'regressing'
  return 'flat'
}

function computeProgressionStatus(idx, progression) {
  const levels = idx.levelsByProgression.get(progression.id) ?? []
  const currentLevelObj = levels[progression.currentLevel]
  if (!currentLevelObj) {
    return { name: progression.name, noData: true, reason: 'no level data at currentLevel' }
  }
  const movement = idx.movementById.get(currentLevelObj.movementId)
  const movementName = movement?.name ?? 'unknown movement'
  const mode = currentLevelObj.mode

  const sessions = rungSessions(idx, progression, currentLevelObj.movementId)
  if (sessions.length === 0) {
    return {
      name: progression.name,
      movementName,
      mode,
      sessionsAtRung: 0,
      noSessions: true,
    }
  }

  const recent = sessions.slice(-RECENT_SESSIONS_FOR_TREND)
  const bestValuePerSession = recent.map((sess) => {
    const values = sess.sets.map((s) => setValue(mode, s)).filter((v) => v != null)
    return values.length > 0 ? Math.max(...values) : null
  })
  const bestRecentValue = bestValuePerSession.filter((v) => v != null).reduce((a, b) => Math.max(a, b), -Infinity)
  const trend = computeTrend(bestValuePerSession)

  // Readiness-style summary (reps-mode current-level work only — see
  // src/lib/readiness-engine.ts / progression-metrics.ts for the full
  // evaluator this coarsens). A session "qualifies" here when every
  // countable set hit its target reps AND the last set's rir (if logged)
  // is >= READINESS_MIN_RIR. Absent rir is a non-veto, matching
  // sessionQualifies()'s convention.
  let readiness = null
  if (mode === 'reps') {
    let qualifying = 0
    for (const sess of recent) {
      const sets = sess.sets
      if (sets.length === 0) continue
      const allHitTarget = sets.every(
        (s) => s.targetReps != null && s.actualReps != null && s.actualReps >= s.targetReps,
      )
      const lastSet = sets[sets.length - 1]
      const rirOk = lastSet.rir == null || lastSet.rir >= READINESS_MIN_RIR
      if (allHitTarget && rirOk) qualifying++
    }
    readiness = { qualifying, ofSessions: recent.length }
  }

  const stalled = sessions.length >= 3 && recent.length >= 3 && trend !== 'improving'

  return {
    name: progression.name,
    movementName,
    mode,
    sessionsAtRung: sessions.length,
    bestRecentValue: Number.isFinite(bestRecentValue) ? bestRecentValue : null,
    trend,
    readiness,
    stalled,
  }
}

// ───────────────────────── RIR pattern ─────────────────────────

function computeRirPattern(idx, now) {
  const recentStart = now - RECENT_WEEKS_FOR_SKIP_RATE * WEEK_MS
  const priorStart = recentStart - RECENT_WEEKS_FOR_SKIP_RATE * WEEK_MS

  const recent = { total: 0, withRir: 0, byValue: new Map() }
  const prior = { total: 0, withRir: 0, byValue: new Map() }

  for (const set of idx.setLogs) {
    if (!isCountable(set)) continue
    if (set.targetReps == null) continue // rir only meaningful on reps-mode sets
    const log = idx.workoutLogById.get(set.workoutLogId)
    if (!log || typeof log.completedAt !== 'number') continue

    let bucket = null
    if (log.completedAt >= recentStart && log.completedAt <= now) bucket = recent
    else if (log.completedAt >= priorStart && log.completedAt < recentStart) bucket = prior
    if (!bucket) continue

    bucket.total++
    if (set.rir != null) {
      bucket.withRir++
      const key = set.rir >= 3 ? '3+' : String(set.rir)
      bucket.byValue.set(key, (bucket.byValue.get(key) ?? 0) + 1)
    }
  }

  const toPlain = (b) => ({
    totalSets: b.total,
    setsWithRirLogged: b.withRir,
    distribution: Object.fromEntries(b.byValue),
  })

  return { recent: toPlain(recent), prior: toPlain(prior) }
}

// ───────────────────────── bodyweight ─────────────────────────

function computeBodyweight(idx, now) {
  const logs = [...idx.bodyweightLogs].sort((a, b) => a.date - b.date)
  if (logs.length === 0) return { noData: true }

  const last8 = logs.slice(-8)

  // 4-week delta: most recent reading vs. the reading closest to (now - 28d),
  // among readings at or before that point in time.
  const fourWeeksAgo = now - 4 * WEEK_MS
  const before = logs.filter((l) => l.date <= fourWeeksAgo)
  const reference = before.length > 0 ? before[before.length - 1] : null
  const latest = logs[logs.length - 1]
  const delta = reference ? latest.kg - reference.kg : null

  // Strength-to-weight note: best weighted (loaded) set, matched to the
  // closest bodyweight reading at or before that set's session date.
  let strengthToWeight = null
  let bestLoadedKg = -Infinity
  let bestLoadedSet = null
  for (const set of idx.setLogs) {
    if (!isCountable(set)) continue
    if (set.actualWeightKg == null) continue
    if (set.actualWeightKg > bestLoadedKg) {
      bestLoadedKg = set.actualWeightKg
      bestLoadedSet = set
    }
  }
  if (bestLoadedSet) {
    const log = idx.workoutLogById.get(bestLoadedSet.workoutLogId)
    const at = log?.completedAt ?? now
    const priorReadings = logs.filter((l) => l.date <= at)
    const bw = priorReadings.length > 0 ? priorReadings[priorReadings.length - 1] : logs[0]
    strengthToWeight = {
      movementName: bestLoadedSet.movementName,
      loadKg: bestLoadedSet.actualWeightKg,
      bodyweightKg: bw.kg,
      ratio: bw.kg > 0 ? bestLoadedSet.actualWeightKg / bw.kg : null,
    }
  }

  return {
    last8: last8.map((l) => ({ date: isoDate(l.date), kg: l.kg })),
    fourWeekDelta: delta,
    deltaReferenceDate: reference ? isoDate(reference.date) : null,
    strengthToWeight,
  }
}

// ───────────────────────── skip rate ─────────────────────────

function computeSkipRate(idx, now) {
  const windowStart = now - RECENT_WEEKS_FOR_SKIP_RATE * WEEK_MS
  const byWorkout = new Map() // workoutName -> { skipped, total }

  for (const set of idx.setLogs) {
    if (set.warmup) continue // warm-up sets aren't prescribed work; excluded from skip accounting too
    const log = idx.workoutLogById.get(set.workoutLogId)
    if (!log || typeof log.completedAt !== 'number') continue
    if (log.completedAt < windowStart || log.completedAt > now) continue

    const name = log.workoutName ?? 'unknown workout'
    const entry = byWorkout.get(name) ?? { skipped: 0, total: 0 }
    entry.total++
    if (set.skipped) entry.skipped++
    byWorkout.set(name, entry)
  }

  return [...byWorkout.entries()]
    .map(([workoutName, { skipped, total }]) => ({
      workoutName,
      skipped,
      total,
      rate: total > 0 ? skipped / total : 0,
    }))
    .sort((a, b) => b.rate - a.rate)
}

// ───────────────────────── nutrition ─────────────────────────

// foodLogs are already denormalized with a `date` field that the repository
// buckets to start-of-day (see foodLogRepository.add), but we re-normalize
// with startOfDayUTC here so this script doesn't depend on that invariant
// holding across every historical row (e.g. imported/synced data).
function groupFoodLogsByDay(foodLogs) {
  const map = new Map()
  for (const log of foodLogs) {
    if (typeof log.date !== 'number') continue
    const day = startOfDayUTC(log.date)
    const entry = map.get(day) ?? { kcal: 0, proteinG: 0, carbG: 0, fatG: 0, fiberG: 0 }
    entry.kcal += log.kcal ?? 0
    entry.proteinG += log.proteinG ?? 0
    entry.carbG += log.carbG ?? 0
    entry.fatG += log.fatG ?? 0
    entry.fiberG += log.fiberG ?? 0
    map.set(day, entry)
  }
  return map
}

function computeNutrition(idx, now) {
  const { foodLogs, measurements, nutritionTargets, bodyweightLogs } = idx

  if (foodLogs.length === 0 && measurements.length === 0 && nutritionTargets.length === 0) {
    return { noData: true }
  }

  const byDay = groupFoodLogsByDay(foodLogs)
  const sortedDayKeys = [...byDay.keys()].sort((a, b) => a - b)

  const dailyTotals = sortedDayKeys.slice(-NUTRITION_DAYS_TO_SHOW).map((day) => ({
    date: isoDate(day),
    ...byDay.get(day),
  }))

  // Rolling average is computed over *logged* days within the window only —
  // averaging in unlogged days as zero would understate true intake, since we
  // have no way to know whether an unlogged day means "didn't eat" or "didn't track".
  const rollingStart = now - NUTRITION_ROLLING_WINDOW_DAYS * DAY_MS
  const rollingDayKeys = sortedDayKeys.filter((d) => d >= rollingStart && d <= now)
  let rollingAvg = null
  if (rollingDayKeys.length > 0) {
    let kcalSum = 0
    let proteinSum = 0
    for (const d of rollingDayKeys) {
      const t = byDay.get(d)
      kcalSum += t.kcal
      proteinSum += t.proteinG
    }
    rollingAvg = {
      kcal: kcalSum / rollingDayKeys.length,
      proteinG: proteinSum / rollingDayKeys.length,
      loggedDays: rollingDayKeys.length,
    }
  }

  const sortedTargets = [...nutritionTargets].sort((a, b) => b.effectiveDate - a.effectiveDate)
  const currentTargetRaw = sortedTargets.find((t) => t.effectiveDate <= now) ?? sortedTargets[0] ?? null

  let adherence = null
  if (rollingAvg && currentTargetRaw) {
    adherence = {
      avgKcal: rollingAvg.kcal,
      targetKcal: currentTargetRaw.kcal,
      kcalDelta: rollingAvg.kcal - currentTargetRaw.kcal,
      avgProteinG: rollingAvg.proteinG,
      targetProteinG: currentTargetRaw.proteinG,
      proteinDelta: rollingAvg.proteinG - currentTargetRaw.proteinG,
      loggedDays: rollingAvg.loggedDays,
    }
  }

  // Adaptive TDEE estimate: over a trailing window, estimatedTDEE ≈
  // avgDailyKcal − (weightChangeKg × 7700 / days). We anchor "days" to the
  // actual elapsed time between two real bodyweight readings (mirrors
  // computeBodyweight's fourWeekDelta pattern), not a fixed 14 — a sparser
  // bodyweight-logging cadence just widens the window. We additionally
  // require real food-logging coverage inside that same span, since a wide
  // elapsed-days window with a handful of logged days would produce a
  // meaningless avgDailyKcal.
  let tdee = null
  const sortedBW = [...bodyweightLogs].sort((a, b) => a.date - b.date)
  if (sortedBW.length > 0) {
    const windowStart = now - NUTRITION_TDEE_WINDOW_DAYS * DAY_MS
    const before = sortedBW.filter((l) => l.date <= windowStart)
    const reference = before.length > 0 ? before[before.length - 1] : sortedBW[0]
    const latest = sortedBW[sortedBW.length - 1]
    const actualDays = (latest.date - reference.date) / DAY_MS
    const loggedDayKeysInWindow = sortedDayKeys.filter((d) => d >= reference.date && d <= latest.date)

    if (actualDays >= NUTRITION_TDEE_WINDOW_DAYS && loggedDayKeysInWindow.length >= NUTRITION_TDEE_MIN_LOGGED_DAYS) {
      const totalKcalInWindow = loggedDayKeysInWindow.reduce((sum, d) => sum + byDay.get(d).kcal, 0)
      const avgDailyKcal = totalKcalInWindow / actualDays
      const weightChangeKg = latest.kg - reference.kg
      const estimatedTDEE = avgDailyKcal - (weightChangeKg * KCAL_PER_KG) / actualDays

      let targetDeltaKcal = null
      let suggestion = 'no current nutrition target set — cannot compare against estimated maintenance'
      if (currentTargetRaw) {
        targetDeltaKcal = estimatedTDEE - currentTargetRaw.kcal
        if (Math.abs(targetDeltaKcal) < 100) {
          suggestion = 'target kcal roughly matches estimated maintenance — actual rate of change should track intent'
        } else if (targetDeltaKcal > 0) {
          suggestion =
            `estimated maintenance (~${Math.round(estimatedTDEE)} kcal) is ${Math.round(targetDeltaKcal)} kcal ` +
            `above the current target — actual deficit/surplus is larger than intended; consider raising the target`
        } else {
          suggestion =
            `estimated maintenance (~${Math.round(estimatedTDEE)} kcal) is ${Math.round(-targetDeltaKcal)} kcal ` +
            `below the current target — actual deficit/surplus is smaller than intended; consider lowering the target`
        }
      }

      tdee = {
        estimatedTDEE,
        avgDailyKcal,
        weightChangeKg,
        actualDays: Math.round(actualDays),
        referenceDate: isoDate(reference.date),
        latestDate: isoDate(latest.date),
        loggedDaysInWindow: loggedDayKeysInWindow.length,
        targetDeltaKcal,
        suggestion,
      }
    } else {
      tdee = {
        insufficientData: true,
        actualDays: Math.round(actualDays),
        loggedDaysInWindow: loggedDayKeysInWindow.length,
      }
    }
  }

  // Waist trend: latest measurement with waistCm vs. the reading closest to
  // (now - 4 weeks), same pattern as computeBodyweight's fourWeekDelta.
  let waistTrend = null
  const withWaist = measurements.filter((m) => m.waistCm != null).sort((a, b) => a.date - b.date)
  if (withWaist.length > 0) {
    const fourWeeksAgo = now - 4 * WEEK_MS
    const before = withWaist.filter((m) => m.date <= fourWeeksAgo)
    const reference = before.length > 0 ? before[before.length - 1] : null
    const latest = withWaist[withWaist.length - 1]
    waistTrend = {
      latestWaistCm: latest.waistCm,
      latestDate: isoDate(latest.date),
      referenceWaistCm: reference ? reference.waistCm : null,
      referenceDate: reference ? isoDate(reference.date) : null,
      delta: reference ? latest.waistCm - reference.waistCm : null,
    }
  }

  const currentTarget = currentTargetRaw
    ? {
        kcal: currentTargetRaw.kcal,
        proteinG: currentTargetRaw.proteinG,
        carbG: currentTargetRaw.carbG ?? null,
        fatG: currentTargetRaw.fatG ?? null,
        effectiveDate: isoDate(currentTargetRaw.effectiveDate),
        setBy: currentTargetRaw.setBy,
      }
    : null

  return {
    dailyTotals,
    rollingAvg,
    currentTarget,
    adherence,
    tdee,
    waistTrend,
  }
}

// ───────────────────────── report assembly ─────────────────────────

function computeReport(snapshot, now) {
  const idx = buildIndices(snapshot)

  const weeklyVolume = computeWeeklyVolume(idx, now)
  const progressionStatus = idx.progressions.map((p) => computeProgressionStatus(idx, p))
  const rirPattern = computeRirPattern(idx, now)
  const bodyweight = computeBodyweight(idx, now)
  const stallFlags = progressionStatus.filter((p) => p.stalled)
  const skipRate = computeSkipRate(idx, now)
  const nutrition = computeNutrition(idx, now)

  return {
    generatedAt: new Date(now).toISOString(),
    snapshotExportedAt: snapshot.exportedAt ?? null,
    snapshotVersion: snapshot.version ?? null,
    weeklyVolume,
    progressionStatus,
    rirPattern,
    bodyweight,
    stallFlags,
    skipRate,
    nutrition,
  }
}

// ───────────────────────── markdown rendering ─────────────────────────

function fmtNum(n, unit) {
  if (n == null || !Number.isFinite(n)) return 'n/a'
  return unit ? `${n}${unit}` : String(n)
}

function renderMarkdown(report, opts) {
  const lines = []
  lines.push('# Training Report')
  lines.push('')
  lines.push(`Generated: ${report.generatedAt}`)
  lines.push(`Snapshot exported: ${report.snapshotExportedAt ?? 'unknown'} (format version ${report.snapshotVersion ?? 'unknown'})`)
  if (opts.profilePath) {
    lines.push(`Coach profile: ${opts.profilePath} (${opts.profileFound ? 'found' : 'NOT FOUND'})`)
  }
  lines.push('')

  lines.push('## Weekly Set Volume (last 8 weeks)')
  lines.push('')
  const hasVolume = report.weeklyVolume.some((w) => w.sets > 0)
  if (!hasVolume) {
    lines.push('no data')
  } else {
    lines.push('| Week starting | Sets |')
    lines.push('|---|---|')
    for (const w of report.weeklyVolume) lines.push(`| ${w.weekStart} | ${w.sets} |`)
  }
  lines.push('')

  lines.push('## Progression Status')
  lines.push('')
  if (report.progressionStatus.length === 0) {
    lines.push('no data')
    lines.push('')
  } else {
    for (const p of report.progressionStatus) {
      lines.push(`### ${p.name}`)
      if (p.noData) {
        lines.push(`- no data (${p.reason})`)
        lines.push('')
        continue
      }
      lines.push(`- Current level: ${p.movementName} (mode: ${p.mode})`)
      if (p.noSessions) {
        lines.push('- No completed sessions logged at this rung — no data')
        lines.push('')
        continue
      }
      const unit = p.mode === 'reps' ? ' reps' : 's'
      lines.push(`- Sessions at this rung: ${p.sessionsAtRung}`)
      lines.push(`- Best recent set (last ${RECENT_SESSIONS_FOR_TREND} sessions): ${fmtNum(p.bestRecentValue, unit)}`)
      lines.push(`- Trend: ${p.trend}`)
      if (p.readiness) {
        lines.push(
          `- Readiness signal: ${p.readiness.qualifying}/${p.readiness.ofSessions} recent sessions hit target reps @ RIR ≥ ${READINESS_MIN_RIR}`,
        )
      } else {
        lines.push('- Readiness signal: n/a (hold-mode rung — see best recent hold above)')
      }
      lines.push(`- Stall flag: ${p.stalled ? `STALLED (${p.sessionsAtRung} sessions, no improvement)` : 'none'}`)
      lines.push('')
    }
  }

  lines.push('## RIR Pattern')
  lines.push('')
  const { recent, prior } = report.rirPattern
  if (recent.totalSets === 0 && prior.totalSets === 0) {
    lines.push('no data')
  } else {
    const renderPeriod = (label, p) => {
      lines.push(`**${label}** — ${p.totalSets} reps-mode sets, ${p.setsWithRirLogged} with rir logged`)
      if (p.setsWithRirLogged === 0) {
        lines.push('  - no rir logged this period')
      } else {
        const dist = Object.entries(p.distribution)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([k, v]) => `rir ${k}: ${v}`)
          .join(', ')
        lines.push(`  - distribution: ${dist}`)
      }
    }
    renderPeriod(`Recent (last ${RECENT_WEEKS_FOR_SKIP_RATE} weeks)`, recent)
    renderPeriod(`Prior (${RECENT_WEEKS_FOR_SKIP_RATE} weeks before that)`, prior)
  }
  lines.push('')

  lines.push('## Bodyweight')
  lines.push('')
  if (report.bodyweight.noData) {
    lines.push('no data')
  } else {
    const bw = report.bodyweight
    lines.push(`- Last ${bw.last8.length} readings: ${bw.last8.map((l) => `${l.date}: ${l.kg}kg`).join(', ')}`)
    if (bw.fourWeekDelta != null) {
      const sign = bw.fourWeekDelta >= 0 ? '+' : ''
      lines.push(`- 4-week delta: ${sign}${bw.fourWeekDelta.toFixed(1)}kg (vs. reading on ${bw.deltaReferenceDate})`)
    } else {
      lines.push('- 4-week delta: no reading old enough to compare against')
    }
    if (bw.strengthToWeight) {
      const s = bw.strengthToWeight
      const ratio = s.ratio != null ? s.ratio.toFixed(2) : 'n/a'
      lines.push(
        `- Best strength-to-weight: ${s.loadKg}kg on ${s.movementName} at ${s.bodyweightKg}kg bodyweight (ratio ${ratio})`,
      )
    } else {
      lines.push('- No weighted sets logged — no strength-to-weight note')
    }
  }
  lines.push('')

  lines.push('## Stall Flags')
  lines.push('')
  if (report.stallFlags.length === 0) {
    lines.push('none')
  } else {
    for (const p of report.stallFlags) {
      lines.push(`- ${p.name} — ${p.sessionsAtRung} sessions at rung, trend: ${p.trend}`)
    }
  }
  lines.push('')

  lines.push(`## Skip Rate (last ${RECENT_WEEKS_FOR_SKIP_RATE} weeks, by workout)`)
  lines.push('')
  if (report.skipRate.length === 0) {
    lines.push('no data')
  } else {
    lines.push('| Workout | Skipped | Total | Rate |')
    lines.push('|---|---|---|---|')
    for (const w of report.skipRate) {
      lines.push(`| ${w.workoutName} | ${w.skipped} | ${w.total} | ${(w.rate * 100).toFixed(0)}% |`)
    }
  }
  lines.push('')

  lines.push('## Nutrition')
  lines.push('')
  if (report.nutrition.noData) {
    lines.push('no data')
    lines.push('')
  } else {
    const n = report.nutrition

    lines.push(`### Daily Totals (last ${NUTRITION_DAYS_TO_SHOW} logged days)`)
    lines.push('')
    if (n.dailyTotals.length === 0) {
      lines.push('no data')
    } else {
      lines.push('| Date | Kcal | Protein (g) | Carb (g) | Fat (g) | Fiber (g) |')
      lines.push('|---|---|---|---|---|---|')
      for (const d of n.dailyTotals) {
        lines.push(
          `| ${d.date} | ${Math.round(d.kcal)} | ${Math.round(d.proteinG)} | ${Math.round(d.carbG)} | ${Math.round(d.fatG)} | ${Math.round(d.fiberG)} |`,
        )
      }
    }
    lines.push('')

    lines.push(`### Rolling ${NUTRITION_ROLLING_WINDOW_DAYS}-day Average`)
    lines.push('')
    if (!n.rollingAvg) {
      lines.push('no data')
    } else {
      lines.push(
        `- ${Math.round(n.rollingAvg.kcal)} kcal/day, ${Math.round(n.rollingAvg.proteinG)}g protein/day ` +
          `(averaged over ${n.rollingAvg.loggedDays} logged day(s) in the window)`,
      )
    }
    lines.push('')

    lines.push('### Current Target')
    lines.push('')
    if (!n.currentTarget) {
      lines.push('no target set')
    } else {
      const t = n.currentTarget
      lines.push(
        `- ${t.kcal} kcal, ${t.proteinG}g protein` +
          `${t.carbG != null ? `, ${t.carbG}g carb` : ''}${t.fatG != null ? `, ${t.fatG}g fat` : ''} ` +
          `— effective ${t.effectiveDate}, set by ${t.setBy}`,
      )
    }
    lines.push('')

    lines.push('### Adherence vs. Target')
    lines.push('')
    if (!n.adherence) {
      lines.push('no data (need both a rolling average and a current target)')
    } else {
      const a = n.adherence
      const kcalSign = a.kcalDelta >= 0 ? '+' : ''
      const proteinSign = a.proteinDelta >= 0 ? '+' : ''
      lines.push(
        `- Kcal: averaging ${Math.round(a.avgKcal)} vs. target ${a.targetKcal} (${kcalSign}${Math.round(a.kcalDelta)})`,
      )
      lines.push(
        `- Protein: averaging ${Math.round(a.avgProteinG)}g vs. target ${a.targetProteinG}g (${proteinSign}${Math.round(a.proteinDelta)}g)`,
      )
      lines.push(`- Based on ${a.loggedDays} logged day(s) in the last ${NUTRITION_ROLLING_WINDOW_DAYS} days`)
    }
    lines.push('')

    lines.push('### Estimated Maintenance (Adaptive TDEE)')
    lines.push('')
    if (!n.tdee) {
      lines.push('no data (no bodyweight logs)')
    } else if (n.tdee.insufficientData) {
      lines.push(
        `insufficient data — need at least ${NUTRITION_TDEE_WINDOW_DAYS} days of bodyweight history and ` +
          `${NUTRITION_TDEE_MIN_LOGGED_DAYS}+ logged food days in that span ` +
          `(have ${n.tdee.actualDays} day(s) of bodyweight history, ${n.tdee.loggedDaysInWindow} logged food day(s))`,
      )
    } else {
      const t = n.tdee
      lines.push(
        `- Estimated TDEE: ~${Math.round(t.estimatedTDEE)} kcal (avg intake ${Math.round(t.avgDailyKcal)} kcal/day, ` +
          `weight change ${t.weightChangeKg >= 0 ? '+' : ''}${t.weightChangeKg.toFixed(1)}kg over ${t.actualDays} days, ` +
          `${t.referenceDate} → ${t.latestDate})`,
      )
      lines.push(`- ${t.suggestion}`)
    }
    lines.push('')

    lines.push('### Waist Trend')
    lines.push('')
    if (!n.waistTrend) {
      lines.push('no data')
    } else {
      const w = n.waistTrend
      if (w.delta != null) {
        const sign = w.delta >= 0 ? '+' : ''
        lines.push(
          `- ${w.latestWaistCm}cm on ${w.latestDate} (${sign}${w.delta.toFixed(1)}cm vs. ${w.referenceWaistCm}cm on ${w.referenceDate})`,
        )
      } else {
        lines.push(`- ${w.latestWaistCm}cm on ${w.latestDate} (no reading ~4 weeks old to compare against)`)
      }
    }
    lines.push('')
  }

  return lines.join('\n')
}

// ───────────────────────── main ─────────────────────────

function main() {
  const { snapshotPath, profilePath, jsonFlag } = parseArgs(process.argv.slice(2))
  if (!snapshotPath) {
    usage()
    process.exit(1)
  }

  const snapshot = loadSnapshot(snapshotPath)
  const now = Date.now()
  const report = computeReport(snapshot, now)

  if (jsonFlag) {
    console.log(JSON.stringify(report, null, 2))
    return
  }

  const profileFound = profilePath ? existsSync(profilePath) : false
  console.log(renderMarkdown(report, { profilePath, profileFound }))
}

main()
