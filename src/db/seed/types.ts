import type { MovementFamily, PrepTag, SetMode, TempoSpec, GateSpec } from "@/models/types";

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
}

export interface SeedProgression {
  name: string;
  levels: SeedLevelDef[];
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
  totalCycles: number;
  days: Array<{ workout: string } | null>;
}
