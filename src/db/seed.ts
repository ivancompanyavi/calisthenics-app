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
    changes: Partial<Pick<Movement, "seedImagePath" | "coachingCues">>;
  }> = [];

  const seedByName = new Map(SEED_MOVEMENTS.map((m) => [m.name, m]));

  for (const m of SEED_MOVEMENTS) {
    const seedImagePath = seedImagePathFor(m.name);
    const existingMovement = existingByName.get(m.name);
    if (!existingMovement) {
      const id = generateId();
      movementMap.set(m.name, id);
      toAdd.push({
        id,
        name: m.name,
        description: m.description,
        coachingCues: m.coachingCues,
        seedImagePath,
        createdAt: Date.now(),
      });
      continue;
    }

    const changes: Partial<Pick<Movement, "seedImagePath" | "coachingCues">> =
      {};
    if (existingMovement.seedImagePath !== seedImagePath) {
      changes.seedImagePath = seedImagePath;
    }
    if (m.coachingCues && !existingMovement.coachingCues) {
      changes.coachingCues = m.coachingCues;
    }
    if (Object.keys(changes).length > 0) {
      toUpdate.push({ id: existingMovement.id, changes });
    }
  }

  // Backfill anything still missing for previously-seeded movements.
  for (const m of existing) {
    if (!seedNames.has(m.name)) continue;
    const seed = seedByName.get(m.name);
    const changes: Partial<Pick<Movement, "seedImagePath" | "coachingCues">> =
      {};
    if (!m.seedImagePath) {
      changes.seedImagePath = seedImagePathFor(m.name);
    }
    if (seed?.coachingCues && !m.coachingCues) {
      changes.coachingCues = seed.coachingCues;
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

async function ensureProgressionsExist(
  movementMap: Map<string, string>,
): Promise<Map<string, string>> {
  const progressionMap = new Map<string, string>();
  const existing = await db.progressions.toArray();
  for (const p of existing) {
    progressionMap.set(p.name, p.id);
  }

  const newProgressions: Progression[] = [];
  const newLevels: ProgressionLevel[] = [];

  for (const sp of SEED_PROGRESSIONS) {
    if (progressionMap.has(sp.name)) continue;
    const progId = generateId();
    progressionMap.set(sp.name, progId);
    newProgressions.push({
      id: progId,
      name: sp.name,
      currentLevel: 0,
      createdAt: Date.now(),
    });

    for (let i = 0; i < sp.levels.length; i++) {
      const lvl = sp.levels[i];
      const movementId = movementMap.get(lvl.movement);
      if (!movementId) continue;
      newLevels.push({
        id: generateId(),
        progressionId: progId,
        movementId,
        order: i,
        mode: lvl.mode,
        defaultTargetReps: lvl.defaultTargetReps,
        defaultTargetSeconds: lvl.defaultTargetSeconds,
        perSide: lvl.perSide,
      });
    }
  }

  if (newProgressions.length > 0) {
    await db.progressions.bulkAdd(newProgressions);
    await db.progressionLevels.bulkAdd(newLevels);
  }
  return progressionMap;
}

async function ensureWorkoutsExist(
  progressionMap: Map<string, string>,
  movementMap: Map<string, string>,
) {
  const existingWorkouts = await db.workouts.toArray();
  const existingNames = new Set(existingWorkouts.map((w) => w.name));

  const newWorkouts: Workout[] = [];
  const newBlocks: WorkoutBlock[] = [];
  const newEntries: BlockEntry[] = [];

  for (const sw of SEED_WORKOUTS) {
    if (existingNames.has(sw.name)) continue;

    const workoutId = generateId();
    newWorkouts.push({
      id: workoutId,
      name: sw.name,
      restBetweenBlocksSeconds: sw.restBetweenBlocksSeconds,
      createdAt: Date.now(),
    });

    for (let i = 0; i < sw.blocks.length; i++) {
      const blockDef = sw.blocks[i];
      const blockId = generateId();
      newBlocks.push({
        id: blockId,
        workoutId,
        type: blockDef.type,
        order: i,
        rounds: blockDef.rounds,
        restSeconds: blockDef.restSeconds,
      });

      for (let j = 0; j < blockDef.entries.length; j++) {
        const entryDef = blockDef.entries[j];

        if (entryDef.movement) {
          const movementId = movementMap.get(entryDef.movement);
          if (!movementId) continue;
          newEntries.push({
            id: generateId(),
            blockId,
            movementId,
            mode: entryDef.mode,
            targetReps: entryDef.targetReps,
            targetSeconds: entryDef.targetSeconds,
            perSide: entryDef.perSide,
            order: j,
          });
        } else if (entryDef.progression) {
          const progressionId = progressionMap.get(entryDef.progression);
          if (!progressionId) continue;
          newEntries.push({
            id: generateId(),
            blockId,
            progressionId,
            targetReps: entryDef.targetReps,
            targetSeconds: entryDef.targetSeconds,
            perSide: entryDef.perSide,
            order: j,
          });
        }
      }
    }
  }

  if (newWorkouts.length > 0) {
    await db.transaction(
      "rw",
      [db.workouts, db.workoutBlocks, db.blockEntries],
      async () => {
        await db.workouts.bulkAdd(newWorkouts);
        await db.workoutBlocks.bulkAdd(newBlocks);
        await db.blockEntries.bulkAdd(newEntries);
      },
    );
  }
}

async function ensureProgramsExist() {
  const existingPrograms = await db.programs.toArray();
  const existingNames = new Set(existingPrograms.map((p) => p.name));

  const allWorkouts = await db.workouts.toArray();
  const workoutByName = new Map(allWorkouts.map((w) => [w.name, w.id]));

  const newPrograms: Program[] = [];
  const newDays: ProgramDay[] = [];

  for (const sp of SEED_PROGRAMS) {
    if (existingNames.has(sp.name)) continue;

    const programId = generateId();
    newPrograms.push({
      id: programId,
      name: sp.name,
      cycleLengthDays: sp.days.length,
      totalCycles: sp.totalCycles,
      createdAt: Date.now(),
    });

    for (let i = 0; i < sp.days.length; i++) {
      const day = sp.days[i];
      newDays.push({
        id: generateId(),
        programId,
        dayNumber: i + 1,
        workoutId: day ? workoutByName.get(day.workout) : undefined,
      });
    }
  }

  if (newPrograms.length > 0) {
    await db.transaction("rw", [db.programs, db.programDays], async () => {
      await db.programs.bulkAdd(newPrograms);
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
