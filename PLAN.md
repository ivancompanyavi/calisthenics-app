# Improvement Plan — Calisthenics Tracker

Goal: **market-grade, personal**. Stays single-user, local-first, no accounts. The bar is
"better for calisthenics than anything downloadable" — measured on the two axes chosen as
deep bets: **progression intelligence** and the **coaching layer**. Analytics and execution
UX get targeted polish, not deep investment.

Engineering-health rule for the whole plan: **refactor only in the path of features**.
New logic lands as pure, tested modules (the `execution-engine.ts` pattern); existing debt
is paid exactly where a feature touches it, never as a standalone phase.

---

## Decision log (from planning interview, 2026-07-02)

| Decision | Choice |
|---|---|
| North star | Market-grade personal; no auth/sync/monetization |
| Deep bets | Progression intelligence + coaching layer |
| Set-data friction ceiling | One tap on the **last set** of an exercise (RIR exists; SIR is new) |
| Advancement autonomy | **Suggest, user confirms** — applies to level-up, level-down, everything |
| Advancement criteria | Per-level exit criteria in seed, global heuristic fallback |
| Hold effort signal | SIR ("seconds in reserve") chip on last time/max set |
| Negative signals | Level-down suggestions + stuck-card escalation; fixed week-6 deloads stay authoritative (no fatigue model) |
| Coaching scope | Full calisthenics atlas (30+ skill nodes) + warm-up generation; faults library & notes digest **out** |
| Warm-up integration | Virtual pre-block derived at execution time; toggleable, never stored in workout |
| Exec polish | Audio+haptic cues, rest ±30s + auto-start, pre-start preview/reorder; tempo metronome **out** |
| Analytics polish | Volume balance auditor, heatmap calendar, notes search + test-day PR badges; skill ETAs **out** |
| Extra scope | Web Push workout reminders |
| First ship | Readiness engine |

---

## Phase 1 — Readiness engine (the flagship)

The differentiator no commercial app has: the app understands rung-based skill progressions
and tells you — with evidence — when to move.

### 1.1 Foundation refactor (in-path debt)

- **Unify progression metrics.** `progressions.repository.ts` (stuck diagnostics) and
  `workout-logs.repository.ts` (clean-hit / reps suggestions) independently compute
  per-progression session metrics. Extract one pure module —
  `src/lib/progression-metrics.ts` — that both repositories and the new readiness engine
  consume. Port existing tests; the readiness engine must not read from two divergent
  implementations.
- **Split `AdjustScreen.tsx`** (329 lines) into sub-components (effort chips, weight/band
  input, notes) before adding SIR — the effort-chip component then serves both RIR and SIR.

### 1.2 SIR capture (the missing signal)

- `SetLog.sir?: 0 | 1 | 2` — seconds-in-reserve bucket for time/max sets
  (`0`, `~5s`, `10s+`). Dexie schema bump, additive.
- Chip row appears on the adjust screen for the **final** time/max set of an exercise
  (mirror of RIR, same friction ceiling). RIR chips likewise emphasized on the last set;
  optional elsewhere.

### 1.3 Exit criteria model

- `SeedProgressionLevel.exitCriteria?` — e.g.
  `{ sessions: 3, minReps?: number, sets?: number, minRIR?: number, minHoldSeconds?: number, minSIR?: number }`.
- Global fallback when absent: *3 consecutive sessions hitting target with last-set
  RIR ≥ 2 (reps) or SIR ≥ 1 (holds)*.
- Author explicit criteria for the skill progressions where the default is wrong
  (planche, front lever rungs) as part of this phase; the rest ride the fallback.

### 1.4 Readiness engine + suggestion surfaces

- New pure module `src/lib/readiness-engine.ts` (+ tests): consumes progression metrics +
  exit criteria → verdict per progression:
  `ready-to-advance | close | steady | regressing | stuck`, with evidence strings
  ("3 clean sessions, avg last-set RIR 2.3").
- **Suggest-and-confirm cards** on: Home, progression card (Library), and post-workout
  summary. One tap to accept (calls existing level-up), dismissible with snooze
  (don't re-suggest until next qualifying session).
- **Level-down suggestions**: sustained regression (e.g. 3 sessions below target at RIR 0)
  → same card, inverted. **Stuck escalation**: the existing ≥8-session/≥28-day chip becomes
  an actionable card offering drop-a-rung / swap-variant / add-volume.
- **Advancement audit** (CLAUDE.md hazard): on accepting a level-up, scan workouts for
  entries that name-reference the new rung's movement directly and warn about duplication.

---

## Phase 2 — Execution polish (daily-felt quick wins)

- **Audio + haptic timer cues.** 3-2-1 beeps + vibration on rest and hold countdowns,
  distinct end tone. WebAudio (unlocked on Start tap) + `navigator.vibrate`. Global toggle
  in Settings. Highest value-per-effort item for hold training — stop staring at the phone
  mid-planche.
- **Rest timer ±30s** buttons on the rest screen; adjustments are per-instance, not saved.
- **Auto-start next exercise** when rest hits zero (opt-in setting; default stays
  tap-to-continue).
- **Pre-start preview + reorder.** Ready-phase screen shows the full session queue with
  tempo/gate/suggestion chips; drag-to-reorder entries for this run only (feeds the
  engine's initial queue — the engine already supports requeueing via DELAY_EXERCISE).

---

## Phase 3 — Coaching layer

### 3.1 Skill atlas (full calisthenics map, 30+ nodes)

- **Data model.** New `skills` seed + table: named skill nodes (strict muscle-up, full
  planche, full front lever, HSPU, one-arm pull-up, human flag, V-sit, pistol squat,
  dragon flag, back lever, handstand, L-sit, press-to-handstand, …) with:
  - `prerequisites`: edges referencing either *a progression at level N* or *a movement PR
    threshold* ("8 strict pull-ups", "20s advanced tuck FL").
  - Mapping to an existing progression where one exists; aspirational otherwise.
- **Atlas view** (new page): visual dependency graph — achieved / in-reach / blocked,
  computed live from progressions' `currentLevel` + PRs (both already derivable).
  Tapping a node shows the prerequisite checklist with live progress.
- **Content authoring** is the bulk of this phase: ~30 nodes with prerequisites, plus
  movement entries and pose descriptions for skills not yet in seed.
  ⚠️ New movement images cost OpenAI credits — batch the slugs and **confirm with Ivan
  before each generation run** (per CLAUDE.md).

### 3.2 Warm-up & skill-prep generation

- **Prep templates** keyed by movement family (wrist prep → planche/handstand family,
  scap activation → lever/pull family, hip/ankle prep → legs, band external rotation →
  heavy push). Families tagged on movements in seed (also needed by Phase 4's volume
  auditor — one tagging pass serves both).
- **Virtual pre-block at execution.** On Start, `src/lib/warmup-engine.ts` (pure, tested)
  derives a warm-up block from the day's resolved movements, deduped across families,
  and prepends it to the engine's queue. Toggleable on the ready screen, skippable as a
  block; never persisted into the workout definition. Warm-up sets logged with a
  `warmup: true` flag so they don't pollute PRs/readiness metrics.

---

## Phase 4 — Analytics polish

- **Volume balance auditor.** Weekly volume split by movement family/category
  (push/pull/legs/core) with drift warnings — directly targets the documented drift
  pattern (leg/calf accessories creeping onto pull days). Uses the family tags from 3.2.
- **Heatmap calendar.** GitHub-style year view of session density on History.
- **Notes search.** Search across set/workout notes from History.
- **Test-day PR badges.** PRs achieved in Test Day sessions get badged; PR chips
  distinguish tested maxes from incidental session PRs.

---

## Phase 5 — Workout reminders (Web Push)

- Local-first reminder on scheduled-workout days ("Pull A today"), derived from the
  active program's cycle position.
- iOS PWA supports Web Push (16.4+) only when installed to home screen — which is the
  usage mode already. Prefer a **fully local path** (service-worker scheduled
  notifications / periodic background sync where available) before considering any push
  server; if a push backend proves unavoidable, revisit scope with Ivan first — the app
  is otherwise backend-free.
- Settings: enable/disable, reminder time.

---

## Cross-cutting conventions

- Every new decision module is pure + unit-tested (`readiness-engine`, `warmup-engine`,
  `progression-metrics`), matching the execution-engine pattern.
- Dexie migrations stay additive (schema v10+): `sir` on setLogs, `skills` table,
  `family` on movements, `exitCriteria` on progression levels, settings flags.
- Seed edits are **production changes** — new atlas movements/progressions follow
  `previousNames` and image conventions in CLAUDE.md.
- Suggestion features must respect the trust model everywhere: the app never mutates a
  progression, workout, or program without an explicit confirm tap.

## Out of scope (explicitly decided against)

Accounts / cloud sync / monetization · fatigue-model autoregulated deloads (week-6
deloads stay authoritative) · tempo metronome · common-faults library · notes→coach
digest · skill ETA estimates · full page/hook test-coverage campaign.
