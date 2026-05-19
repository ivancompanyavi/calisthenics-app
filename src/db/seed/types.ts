import type { SetMode } from "@/models/types";

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
