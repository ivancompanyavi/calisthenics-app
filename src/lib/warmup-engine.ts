// Warm-up engine — pure module (no DB access, no side-effects).
//
// Input:  the day's resolved movements, each with family + optional prepTags.
// Output: a single ResolvedBlock to prepend to the execution queue, or null
//         when no movements trigger any template.
//
// Rules:
//  - Template firing: each template has one or more triggers (prepTag or
//    family). A template fires when ANY movement in the session matches
//    ANY of that template's triggers.
//  - Dedupe: each template fires at most once per session even if multiple
//    movements trigger it.
//  - Ordering: wrists → shoulders/scap → hips/legs → core (preserved from
//    ORDERED_WARMUP_TEMPLATES).
//  - Movement resolution: warm-up exercises are looked up by name in the
//    provided movementMap. If a name isn't found the exercise is silently
//    skipped (avoids a crash on a seeding lag).
//  - The returned block has restSeconds=0 and rounds=1; the caller attaches
//    warmup=true to every SetLog produced for it (done in CONFIRM_ADJUST /
//    SKIP_EXERCISE in the execution layer, not here).

import type { MovementFamily, PrepTag } from '@/models/types'
import type { ResolvedBlock, ResolvedEntry } from '@/lib/execution-engine'
import { ORDERED_WARMUP_TEMPLATES } from '@/db/seed/warmups'

// ── Types ─────────────────────────────────────────────────────────────────────

/** Minimal movement shape required by the engine. */
export interface WarmupMovementInput {
  movementId: string
  movementName: string
  family?: MovementFamily
  prepTags?: PrepTag[]
}

/** A resolved movement available for building warm-up entries. */
export interface WarmupMovementRecord {
  id: string
  name: string
  seedImagePath?: string
}

// ── Trigger map ───────────────────────────────────────────────────────────────
// For each template (by label) lists the tags/families that trigger it.
// A template fires when ANY movement in the session matches ANY trigger here.

type Trigger =
  | { kind: 'prepTag'; tag: PrepTag }
  | { kind: 'family'; family: MovementFamily }

const TEMPLATE_TRIGGERS: Record<string, Trigger[]> = {
  wrist: [{ kind: 'prepTag', tag: 'wrist-loaded' }],
  'scap-pull': [
    { kind: 'prepTag', tag: 'scap-pull' },
    { kind: 'family', family: 'pull' },
  ],
  'heavy-push-overhead': [
    { kind: 'prepTag', tag: 'heavy-push' },
    { kind: 'prepTag', tag: 'overhead' },
  ],
  legs: [{ kind: 'family', family: 'legs' }],
  // Core prep fires only when the session actually contains a core movement.
  // (An earlier scap-pull trigger over-fired on ordinary pull days — every
  // scapular-pull movement carries the scap-pull prep tag — so it's removed.)
  core: [{ kind: 'family', family: 'core' }],
}

// ── Core logic ────────────────────────────────────────────────────────────────

/**
 * Determine which warm-up templates are triggered by the session's movements.
 * Returns labels in the canonical order defined by ORDERED_WARMUP_TEMPLATES.
 */
export function getTriggeredTemplateLabels(
  movements: WarmupMovementInput[],
): string[] {
  const triggered: string[] = []

  for (const template of ORDERED_WARMUP_TEMPLATES) {
    const triggers = TEMPLATE_TRIGGERS[template.label] ?? []
    if (triggers.length === 0) continue

    const fires = movements.some((mv) =>
      triggers.some((trigger) => {
        if (trigger.kind === 'family') {
          return mv.family === trigger.family
        }
        // prepTag trigger
        return mv.prepTags?.includes(trigger.tag) ?? false
      }),
    )

    if (fires) {
      triggered.push(template.label)
    }
  }

  return triggered
}

/**
 * Build a ResolvedBlock for the warm-up pre-block.
 *
 * @param movements   Resolved movements for today's session (family + prepTags).
 * @param movementMap Map of movement name → {id, seedImagePath, …} for lookup.
 * @param sessionMovementIds Movement ids already in the main session. A warm-up
 *   exercise resolving to one of these is dropped — prepping a movement the
 *   session already trains is redundant (e.g. Scapular Pulls / Hollow Body Hold
 *   appearing as warm-up for a pull day that already contains them).
 * @returns           A warm-up ResolvedBlock, or null when nothing is triggered.
 */
export function buildWarmupBlock(
  movements: WarmupMovementInput[],
  movementMap: Map<string, WarmupMovementRecord>,
  sessionMovementIds: Set<string> = new Set(),
): ResolvedBlock | null {
  const triggeredLabels = getTriggeredTemplateLabels(movements)
  if (triggeredLabels.length === 0) return null

  const entries: ResolvedEntry[] = []

  for (const label of triggeredLabels) {
    const template = ORDERED_WARMUP_TEMPLATES.find((t) => t.label === label)
    if (!template) continue

    for (const ex of template.exercises) {
      const record = movementMap.get(ex.movement)
      if (!record) continue // movement not yet seeded — skip gracefully
      if (sessionMovementIds.has(record.id)) continue // already in the session — don't duplicate

      const entry: ResolvedEntry = {
        movementId: record.id,
        movementName: ex.movement,
        movementSeedImagePath: record.seedImagePath,
        mode: ex.mode,
        targetReps: ex.targetReps,
        targetSeconds: ex.targetSeconds,
        perSide: ex.perSide,
        // No rest between warm-up exercises; the block-level restSeconds=0.
        restSeconds: 0,
      }
      entries.push(entry)
    }
  }

  if (entries.length === 0) return null

  return {
    type: 'set',
    rounds: 1,
    restSeconds: 0,
    entries,
  }
}
