import { db } from "./index";
import { generateId } from "@/lib/utils";
import type {
  Movement,
  Progression,
  ProgressionLevel,
  Workout,
  WorkoutBlock,
  BlockEntry,
  Program,
  ProgramDay,
} from "@/models/types";
import { SEED_MOVEMENTS } from "./seed/movements";
import { SEED_PROGRESSIONS } from "./seed/progressions";
import { SEED_WORKOUTS } from "./seed/workouts";
import { SEED_PROGRAMS } from "./seed/programs";
import type {
  SeedBlockDef,
  SeedWorkout,
  SeedProgram,
  SeedProgression,
} from "./seed/types";
import { lbToKg } from "@/lib/units";

// Deterministic JSON encoding: sorts object keys at every level so the
// resulting string is stable across runs regardless of property iteration
// order. Used as a content fingerprint for seed definitions.
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return "[" + value.map(stableStringify).join(",") + "]";
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return (
    "{" +
    keys
      .map((k) => JSON.stringify(k) + ":" + stableStringify(obj[k]))
      .join(",") +
    "}"
  );
}

function workoutFingerprint(sw: SeedWorkout): string {
  return stableStringify({
    name: sw.name,
    restBetweenBlocksSeconds: sw.restBetweenBlocksSeconds ?? 0,
    blocks: sw.blocks,
  });
}

function programFingerprint(sp: SeedProgram): string {
  return stableStringify({
    name: sp.name,
    totalCycles: sp.totalCycles,
    days: sp.days,
  });
}

function progressionFingerprint(sp: SeedProgression): string {
  return stableStringify({
    name: sp.name,
    levels: sp.levels,
  });
}

function movementSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function seedImagePathFor(name: string): string {
  return `/exercises/${movementSlug(name)}.webp`;
}

async function ensureMovementsExist(): Promise<Map<string, string>> {
  const movementMap = new Map<string, string>();
  const existing = await db.movements.toArray();
  const existingByName = new Map<string, Movement>();
  for (const m of existing) {
    movementMap.set(m.name, m.id);
    existingByName.set(m.name, m);
  }

  const seedNames = new Set(SEED_MOVEMENTS.map((m) => m.name));

  const toAdd: Movement[] = [];
  const toUpdate: Array<{
    id: string;
    changes: Partial<
      Pick<
        Movement,
        | "name"
        | "seedImagePath"
        | "coachingCues"
        | "description"
        | "referenceUrl"
      >
    >;
  }> = [];

  const seedByName = new Map(SEED_MOVEMENTS.map((m) => [m.name, m]));

  for (const m of SEED_MOVEMENTS) {
    const seedImagePath = seedImagePathFor(m.name);

    // Handle rename: if current name isn't in DB but a previousName is, rename it.
    let existingMovement = existingByName.get(m.name);
    if (!existingMovement && m.previousNames?.length) {
      for (const prev of m.previousNames) {
        const prevMovement = existingByName.get(prev);
        if (prevMovement) {
          existingMovement = prevMovement;
          toUpdate.push({
            id: prevMovement.id,
            changes: {
              name: m.name,
              seedImagePath,
              description: m.description,
              coachingCues: m.coachingCues,
            },
          });
          movementMap.set(m.name, prevMovement.id);
          break;
        }
      }
    }

    if (!existingMovement) {
      const id = generateId();
      movementMap.set(m.name, id);
      toAdd.push({
        id,
        name: m.name,
        description: m.description,
        coachingCues: m.coachingCues,
        referenceUrl: m.referenceUrl,
        seedImagePath,
        createdAt: Date.now(),
      });
      continue;
    }

    const changes: Partial<
      Pick<
        Movement,
        "seedImagePath" | "coachingCues" | "description" | "referenceUrl"
      >
    > = {};
    if (existingMovement.seedImagePath !== seedImagePath) {
      changes.seedImagePath = seedImagePath;
    }
    if (m.coachingCues && !existingMovement.coachingCues) {
      changes.coachingCues = m.coachingCues;
    }
    // Mirror coachingCues policy: seed fills in only when the user hasn't
    // set one. Preserves user-customized form references on subsequent seed
    // syncs. To force a seed-side update, the user can clear the field via
    // MovementForm and re-seed.
    if (m.referenceUrl && !existingMovement.referenceUrl) {
      changes.referenceUrl = m.referenceUrl;
    }
    if (Object.keys(changes).length > 0) {
      toUpdate.push({ id: existingMovement.id, changes });
    }
  }

  // Backfill anything still missing for previously-seeded movements.
  for (const m of existing) {
    if (!seedNames.has(m.name)) continue;
    const seed = seedByName.get(m.name);
    const changes: Partial<
      Pick<Movement, "seedImagePath" | "coachingCues" | "referenceUrl">
    > = {};
    if (!m.seedImagePath) {
      changes.seedImagePath = seedImagePathFor(m.name);
    }
    if (seed?.coachingCues && !m.coachingCues) {
      changes.coachingCues = seed.coachingCues;
    }
    if (seed?.referenceUrl && !m.referenceUrl) {
      changes.referenceUrl = seed.referenceUrl;
    }
    if (Object.keys(changes).length > 0) {
      toUpdate.push({ id: m.id, changes });
    }
  }

  if (toAdd.length > 0) {
    await db.movements.bulkAdd(toAdd);
  }
  if (toUpdate.length > 0) {
    await db.transaction("rw", db.movements, async () => {
      for (const u of toUpdate) {
        await db.movements.update(u.id, u.changes);
      }
    });
  }
  return movementMap;
}

// Build the level rows that belong to a progression given a seed definition.
// Movements that aren't in the movement map (typo, missing seed) are silently
// skipped — matches the original behavior.
function buildProgressionLevels(
  progressionId: string,
  sp: SeedProgression,
  movementMap: Map<string, string>,
): ProgressionLevel[] {
  const levels: ProgressionLevel[] = [];
  for (let i = 0; i < sp.levels.length; i++) {
    const lvl = sp.levels[i];
    const movementId = movementMap.get(lvl.movement);
    if (!movementId) continue;
    levels.push({
      id: generateId(),
      progressionId,
      movementId,
      order: i,
      mode: lvl.mode,
      defaultTargetReps: lvl.defaultTargetReps,
      defaultTargetSeconds: lvl.defaultTargetSeconds,
      perSide: lvl.perSide,
    });
  }
  return levels;
}

// When we rewrite a progression's levels (seed changed), we need to remap
// the user's stored currentLevel index so they keep pointing at the same
// exercise they were working on. If that exercise was removed from the new
// seed, fall back to clamping the index.
export function remapCurrentLevel(
  oldCurrentLevel: number,
  oldLevels: ProgressionLevel[],
  newLevels: ProgressionLevel[],
): number {
  const currentMovementId = oldLevels[oldCurrentLevel]?.movementId;
  if (currentMovementId) {
    const idx = newLevels.findIndex((l) => l.movementId === currentMovementId);
    if (idx >= 0) return idx;
  }
  return Math.max(0, Math.min(oldCurrentLevel, newLevels.length - 1));
}

async function ensureProgressionsExist(
  movementMap: Map<string, string>,
): Promise<Map<string, string>> {
  const progressionMap = new Map<string, string>();
  const existing = await db.progressions.toArray();
  const existingByName = new Map<string, Progression>();
  for (const p of existing) {
    progressionMap.set(p.name, p.id);
    existingByName.set(p.name, p);
  }

  for (const sp of SEED_PROGRESSIONS) {
    const fingerprint = progressionFingerprint(sp);
    const existingProg = existingByName.get(sp.name);

    if (existingProg && existingProg.seedFingerprint === fingerprint) {
      continue;
    }

    if (existingProg) {
      // Stale fingerprint — rewrite levels while preserving the progression's
      // id (so blockEntries/logs still resolve) and remap currentLevel so the
      // user stays on the same exercise they were working on.
      const oldLevels = await db.progressionLevels
        .where("progressionId")
        .equals(existingProg.id)
        .sortBy("order");

      const newLevels = buildProgressionLevels(
        existingProg.id,
        sp,
        movementMap,
      );
      const newCurrentLevel = remapCurrentLevel(
        existingProg.currentLevel,
        oldLevels,
        newLevels,
      );

      await db.transaction(
        "rw",
        [db.progressions, db.progressionLevels],
        async () => {
          await db.progressions.update(existingProg.id, {
            seedFingerprint: fingerprint,
            currentLevel: newCurrentLevel,
          });
          await db.progressionLevels
            .where("progressionId")
            .equals(existingProg.id)
            .delete();
          if (newLevels.length > 0) {
            await db.progressionLevels.bulkAdd(newLevels);
          }
        },
      );
      continue;
    }

    // Fresh insert.
    const progId = generateId();
    progressionMap.set(sp.name, progId);
    const newProgression: Progression = {
      id: progId,
      name: sp.name,
      currentLevel: 0,
      createdAt: Date.now(),
      seedFingerprint: fingerprint,
    };
    const newLevels = buildProgressionLevels(progId, sp, movementMap);
    await db.transaction(
      "rw",
      [db.progressions, db.progressionLevels],
      async () => {
        await db.progressions.add(newProgression);
        if (newLevels.length > 0) {
          await db.progressionLevels.bulkAdd(newLevels);
        }
      },
    );
  }

  return progressionMap;
}

function buildBlocks(
  workoutId: string,
  blockDefs: SeedBlockDef[],
  progressionMap: Map<string, string>,
  movementMap: Map<string, string>,
): { blocks: WorkoutBlock[]; entries: BlockEntry[] } {
  const blocks: WorkoutBlock[] = [];
  const entries: BlockEntry[] = [];

  for (let i = 0; i < blockDefs.length; i++) {
    const blockDef = blockDefs[i];
    const blockId = generateId();
    blocks.push({
      id: blockId,
      workoutId,
      type: blockDef.type,
      order: i,
      rounds: blockDef.rounds,
      restSeconds: blockDef.restSeconds,
    });

    for (let j = 0; j < blockDef.entries.length; j++) {
      const entryDef = blockDef.entries[j];

      const shared = {
        id: generateId(),
        blockId,
        order: j,
        targetReps: entryDef.targetReps,
        targetSeconds: entryDef.targetSeconds,
        perSide: entryDef.perSide,
        tempo: entryDef.tempo,
        gate: entryDef.gate,
        restSeconds: entryDef.restSeconds,
        // entryDef.targetWeight is in lb (seed-author convenience, matches
        // the default UI unit). Convert to canonical kg for storage.
        targetWeightKg:
          entryDef.targetWeight != null ? lbToKg(entryDef.targetWeight) : undefined,
        targetBandLevel: entryDef.targetBandLevel,
      };

      if (entryDef.movement) {
        const movementId = movementMap.get(entryDef.movement);
        if (!movementId) continue;
        entries.push({
          ...shared,
          kind: "movement",
          movementId,
          mode: entryDef.mode ?? "reps",
        });
      } else if (entryDef.progression) {
        const progressionId = progressionMap.get(entryDef.progression);
        if (!progressionId) continue;
        entries.push({
          ...shared,
          kind: "progression",
          progressionId,
        });
      }
    }
  }

  return { blocks, entries };
}

async function ensureWorkoutsExist(
  progressionMap: Map<string, string>,
  movementMap: Map<string, string>,
) {
  const existingWorkouts = await db.workouts.toArray();
  const byName = new Map(existingWorkouts.map((w) => [w.name, w]));

  for (const sw of SEED_WORKOUTS) {
    // Rename existing workout if seed previousNames matches a DB entry.
    let existing = byName.get(sw.name);
    if (!existing && sw.previousNames?.length) {
      for (const prev of sw.previousNames) {
        const prevWorkout = byName.get(prev);
        if (prevWorkout) {
          existing = prevWorkout;
          await db.workouts.update(prevWorkout.id, { name: sw.name });
          existing = { ...prevWorkout, name: sw.name };
          byName.delete(prev);
          byName.set(sw.name, existing);
          break;
        }
      }
    }

    const fingerprint = workoutFingerprint(sw);

    if (existing) {
      // Skip the rewrite entirely when the seed hasn't changed. Preserves any
      // user edits to a seeded workout — and avoids wasted writes on every
      // app launch.
      if (existing.seedFingerprint === fingerprint) {
        continue;
      }

      // Re-seed blocks/entries while preserving workout ID so logs stay linked.
      const oldBlocks = await db.workoutBlocks
        .where("workoutId")
        .equals(existing.id)
        .toArray();
      const oldBlockIds = oldBlocks.map((b) => b.id);

      const { blocks, entries } = buildBlocks(
        existing.id,
        sw.blocks,
        progressionMap,
        movementMap,
      );

      await db.transaction(
        "rw",
        [db.workouts, db.workoutBlocks, db.blockEntries],
        async () => {
          await db.workouts.update(existing.id, {
            restBetweenBlocksSeconds: sw.restBetweenBlocksSeconds,
            seedFingerprint: fingerprint,
          });
          if (oldBlockIds.length > 0) {
            await db.blockEntries
              .where("blockId")
              .anyOf(oldBlockIds)
              .delete();
            await db.workoutBlocks.bulkDelete(oldBlockIds);
          }
          if (blocks.length > 0) {
            await db.workoutBlocks.bulkAdd(blocks);
          }
          if (entries.length > 0) {
            await db.blockEntries.bulkAdd(entries);
          }
        },
      );
      continue;
    }

    // Fresh insert.
    const workoutId = generateId();
    const newWorkout: Workout = {
      id: workoutId,
      name: sw.name,
      restBetweenBlocksSeconds: sw.restBetweenBlocksSeconds,
      createdAt: Date.now(),
      seedFingerprint: fingerprint,
    };
    const { blocks, entries } = buildBlocks(
      workoutId,
      sw.blocks,
      progressionMap,
      movementMap,
    );

    await db.transaction(
      "rw",
      [db.workouts, db.workoutBlocks, db.blockEntries],
      async () => {
        await db.workouts.add(newWorkout);
        if (blocks.length > 0) await db.workoutBlocks.bulkAdd(blocks);
        if (entries.length > 0) await db.blockEntries.bulkAdd(entries);
      },
    );
    byName.set(sw.name, newWorkout);
  }
}

async function ensureProgramsExist() {
  const existingPrograms = await db.programs.toArray();
  const byName = new Map(existingPrograms.map((p) => [p.name, p]));

  const allWorkouts = await db.workouts.toArray();
  const workoutByName = new Map(allWorkouts.map((w) => [w.name, w.id]));

  for (const sp of SEED_PROGRAMS) {
    let existing = byName.get(sp.name);
    if (!existing && sp.previousNames?.length) {
      for (const prev of sp.previousNames) {
        const prevProgram = byName.get(prev);
        if (prevProgram) {
          existing = prevProgram;
          await db.programs.update(prevProgram.id, { name: sp.name });
          existing = { ...prevProgram, name: sp.name };
          byName.delete(prev);
          byName.set(sp.name, existing);
          break;
        }
      }
    }

    const buildDays = (programId: string): ProgramDay[] =>
      sp.days.map((day, i) => ({
        id: generateId(),
        programId,
        dayNumber: i + 1,
        workoutId: day ? workoutByName.get(day.workout) : undefined,
      }));

    const fingerprint = programFingerprint(sp);

    if (existing) {
      if (existing.seedFingerprint === fingerprint) {
        continue;
      }
      const newDays = buildDays(existing.id);
      await db.transaction(
        "rw",
        [db.programs, db.programDays],
        async () => {
          await db.programs.update(existing.id, {
            cycleLengthDays: sp.days.length,
            totalCycles: sp.totalCycles,
            seedFingerprint: fingerprint,
          });
          await db.programDays
            .where("programId")
            .equals(existing.id)
            .delete();
          await db.programDays.bulkAdd(newDays);
        },
      );
      continue;
    }

    const programId = generateId();
    const newProgram: Program = {
      id: programId,
      name: sp.name,
      cycleLengthDays: sp.days.length,
      totalCycles: sp.totalCycles,
      createdAt: Date.now(),
      seedFingerprint: fingerprint,
    };
    const newDays = buildDays(programId);
    await db.transaction("rw", [db.programs, db.programDays], async () => {
      await db.programs.add(newProgram);
      await db.programDays.bulkAdd(newDays);
    });
  }
}

export async function seedDatabase() {
  const movementMap = await ensureMovementsExist();
  const progressionMap = await ensureProgressionsExist(movementMap);
  await ensureWorkoutsExist(progressionMap, movementMap);
  await ensureProgramsExist();
}
