import type { SetMode, TempoSpec, GateSpec } from "@/models/types";

export interface SeedMovement {
  name: string;
  description?: string;
  coachingCues?: string;
  previousNames?: string[];
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
