// Pure skill-atlas evaluator: takes data snapshots and returns per-skill
// statuses with per-prerequisite progress. No side effects, no DB calls.
//
// ── In-reach rule ────────────────────────────────────────────────────────────
// A skill is `in-reach` when:
//   - it is NOT yet achieved (at least one prerequisite unmet), AND
//   - EVERY individual prerequisite has progress ≥ 0.5 (at least halfway there)
//
// Rationale: a skill becomes "in reach" only when no single prerequisite is far
// away. A 50 % floor on each individual gate prevents a skill from appearing
// in-reach when one prereq is at 0 % and others are at 100 %.
//
// `blocked` = not achieved AND at least one prerequisite < 50 % progress.
// `achieved` = all prerequisites met (each at 100 % progress).
// ─────────────────────────────────────────────────────────────────────────────

import type { Skill, SkillPrerequisite, Progression } from '@/models/types'
import type { MovementPR } from '@/repositories/workout-logs.repository'

export type SkillStatus = 'achieved' | 'in-reach' | 'blocked'

export interface PrerequisiteResult {
  prerequisite: SkillPrerequisite
  met: boolean
  // Fractional progress toward meeting this prerequisite: 0.0 – 1.0.
  // Values > 1.0 are not produced (clamped to 1.0 when the threshold is met).
  progress: number
}

export interface SkillResult {
  skillId: string
  status: SkillStatus
  prerequisites: PrerequisiteResult[]
}

// Evaluate a single progression-level prerequisite.
function evalProgressionLevel(
  progressionId: string,
  levelOrder: number,
  progressionById: Map<string, Progression>,
): PrerequisiteResult {
  const prereq: SkillPrerequisite = { kind: 'progression-level', progressionId, levelOrder }
  const progression = progressionById.get(progressionId)
  if (!progression) {
    // Progression not found — treat as 0% progress.
    return { prerequisite: prereq, met: false, progress: 0 }
  }
  const current = progression.currentLevel
  const met = current >= levelOrder
  // Guard against divide-by-zero when levelOrder === 0 (first level — always met).
  const progress = levelOrder === 0 ? 1 : Math.min(current / levelOrder, 1)
  return { prerequisite: prereq, met, progress }
}

// Evaluate a single movement-pr prerequisite.
function evalMovementPR(
  movementId: string,
  minReps: number | undefined,
  minSeconds: number | undefined,
  prById: Map<string, MovementPR>,
): PrerequisiteResult {
  const prereq: SkillPrerequisite = { kind: 'movement-pr', movementId, minReps, minSeconds }
  const pr = prById.get(movementId)

  // If no threshold is specified the prerequisite is satisfied by having any PR.
  if (minReps === undefined && minSeconds === undefined) {
    const met = pr !== undefined
    return { prerequisite: prereq, met, progress: met ? 1 : 0 }
  }

  if (minReps !== undefined) {
    const best = pr?.bestReps ?? 0
    const met = best >= minReps
    const progress = Math.min(best / minReps, 1)
    return { prerequisite: prereq, met, progress }
  }

  // minSeconds
  const target = minSeconds!
  const best = pr?.bestSeconds ?? 0
  const met = best >= target
  const progress = Math.min(best / target, 1)
  return { prerequisite: prereq, met, progress }
}

// Evaluate a list of prerequisites against the current data snapshots.
// Shared by the skill atlas and the progression-entry gate so both derive
// prerequisite progress the same way.
export function evaluatePrerequisites(
  prerequisites: SkillPrerequisite[],
  progressionById: Map<string, Progression>,
  prById: Map<string, MovementPR>,
): PrerequisiteResult[] {
  return prerequisites.map((prereq) => {
    if (prereq.kind === 'progression-level') {
      return evalProgressionLevel(prereq.progressionId, prereq.levelOrder, progressionById)
    }
    return evalMovementPR(prereq.movementId, prereq.minReps, prereq.minSeconds, prById)
  })
}

// Evaluate all prerequisites for a single skill and derive its status.
function evalSkill(
  skill: Skill,
  progressionById: Map<string, Progression>,
  prById: Map<string, MovementPR>,
): SkillResult {
  const prerequisites = evaluatePrerequisites(skill.prerequisites, progressionById, prById)

  // No prerequisites → trivially achieved.
  if (prerequisites.length === 0) {
    return { skillId: skill.id, status: 'achieved', prerequisites }
  }

  const allMet = prerequisites.every((r) => r.met)
  if (allMet) {
    return { skillId: skill.id, status: 'achieved', prerequisites }
  }

  // In-reach: all prerequisites individually ≥ 50% (see module-level comment).
  const allHalfway = prerequisites.every((r) => r.progress >= 0.5)
  const status: SkillStatus = allHalfway ? 'in-reach' : 'blocked'
  return { skillId: skill.id, status, prerequisites }
}

// Main entry point. Pure function: no I/O, no mutation.
// progressions: flat list of Progression rows (with currentLevel)
// movementPRs: map from movementId → MovementPR
export function evaluateSkills(
  skills: Skill[],
  progressions: Progression[],
  movementPRs: Map<string, MovementPR>,
): SkillResult[] {
  const progressionById = new Map(progressions.map((p) => [p.id, p]))
  return skills.map((skill) => evalSkill(skill, progressionById, movementPRs))
}
