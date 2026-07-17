import type { ExitCriteria, MovementFamily, PrepTag, SetMode, TempoSpec, GateSpec, SkillTier } from "@/models/types";

export interface SeedMovement {
  name: string;
  description?: string;
  coachingCues?: string;
  // Optional form-check URL (YouTube, etc). Surfaces as a "Form check" link on
  // the movement card. Not required.
  referenceUrl?: string;
  previousNames?: string[];
  // Every seed movement must carry a family (dominant demand). User-created
  // movements that aren't in the seed leave this undefined on the Movement row.
  family: MovementFamily;
  // Prep tags for warm-up derivation. Omit the field when no prep tags apply.
  prepTags?: PrepTag[];
}

export interface SeedLevelDef {
  movement: string;
  mode: SetMode;
  defaultTargetReps?: number;
  defaultTargetSeconds?: number;
  perSide?: boolean;
  // When set, this level's exit criteria override the global fallback. Absent
  // = use the global fallback (3 consecutive qualifying sessions). Do NOT add
  // real values here until issue #8 (HITL content pass) is complete.
  exitCriteria?: ExitCriteria;
}

export interface SeedProgression {
  name: string;
  levels: SeedLevelDef[];
  // Entry gate: prerequisites (by name) that must be met before this
  // progression is unlocked/trainable. Resolved to ids at seed time by
  // ensureProgressionGatesExist(). Omit = foundational (no gate). Every
  // referenced progression/movement name must EXACTLY match a seed entry —
  // the resolver silently drops unknowns (see resolveSeedPrerequisites).
  entryPrerequisites?: SeedSkillPrerequisite[];
}

export interface SeedEntryDef {
  progression?: string;
  movement?: string;
  mode?: SetMode;
  targetReps?: number;
  targetSeconds?: number;
  perSide?: boolean;
  // Tempo notation (3-1-1-0 etc.). Optional. When omitted, the execution UI
  // shows no tempo guidance.
  tempo?: TempoSpec;
  // Pre-flight gate question (e.g. "Wrists feel good today?"). When the user
  // answers No and skipOnNo is true the entry is auto-skipped.
  gate?: GateSpec;
  // Per-entry rest override. Seed-time convenience; copies through to
  // BlockEntry.restSeconds.
  restSeconds?: number;
  // Prescription weight in POUNDS — matches the default UI unit. Converted
  // to kg at seed-time for canonical storage. Use for machine/dumbbell/cable
  // exercises. Omit for pure bodyweight.
  targetWeight?: number;
  // Numeric band level (1=thinnest, 5=thickest, user-defined mapping). Use
  // for band-resistance / band-assistance exercises instead of targetWeight.
  targetBandLevel?: number;
}

export interface SeedBlockDef {
  type: "set" | "superset";
  rounds: number;
  restSeconds: number;
  entries: SeedEntryDef[];
}

export interface SeedWorkout {
  name: string;
  previousNames?: string[];
  restBetweenBlocksSeconds?: number;
  blocks: SeedBlockDef[];
}

export interface SeedProgram {
  name: string;
  previousNames?: string[];
  description?: string;
  totalCycles: number;
  days: Array<{ workout: string } | null>;
}

// Seed-time prerequisite: references progressions/movements by name.
// ensureSkillsExist() resolves these to ids before writing to the DB.
export type SeedSkillPrerequisite =
  | { kind: 'progression-level'; progression: string; levelOrder: number }
  | { kind: 'movement-pr'; movement: string; minReps?: number; minSeconds?: number }

export interface SeedSkill {
  name: string;
  description?: string;
  tier?: SkillTier;
  prerequisites: SeedSkillPrerequisite[];
}
