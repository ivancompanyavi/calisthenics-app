import '../../repositories/__tests__/setup'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db'
import { remapCurrentLevel, seedDatabase } from '@/db/seed'
import { clearAllTables } from '../../repositories/__tests__/setup'
import type { ProgressionLevel } from '@/models/types'

function makeLevel(
  id: string,
  progressionId: string,
  movementId: string,
  order: number,
): ProgressionLevel {
  return { id, progressionId, movementId, order, mode: 'reps' }
}

describe('remapCurrentLevel', () => {
  it('preserves the movement when its index shifts due to inserted earlier levels', () => {
    // User was at index 1 = mv-tuck. New seed inserts mv-frog at index 1,
    // pushing mv-tuck to index 3. currentLevel should follow the movement.
    const oldLevels = [
      makeLevel('o0', 'p', 'mv-ppp', 0),
      makeLevel('o1', 'p', 'mv-tuck', 1),
    ]
    const newLevels = [
      makeLevel('n0', 'p', 'mv-ppp', 0),
      makeLevel('n1', 'p', 'mv-frog', 1),
      makeLevel('n2', 'p', 'mv-negs', 2),
      makeLevel('n3', 'p', 'mv-tuck', 3),
    ]
    expect(remapCurrentLevel(1, oldLevels, newLevels)).toBe(3)
  })

  it('clamps when the user-current movement is no longer in the new seed', () => {
    const oldLevels = [
      makeLevel('o0', 'p', 'mv-removed', 0),
      makeLevel('o1', 'p', 'mv-old', 1),
    ]
    const newLevels = [
      makeLevel('n0', 'p', 'mv-a', 0),
      makeLevel('n1', 'p', 'mv-b', 1),
      makeLevel('n2', 'p', 'mv-c', 2),
    ]
    // mv-old isn't in new levels → clamp to min(oldIndex, newLength-1) = min(1, 2) = 1.
    expect(remapCurrentLevel(1, oldLevels, newLevels)).toBe(1)
  })

  it('clamps to last index when new seed has fewer levels and movement is missing', () => {
    const oldLevels = [
      makeLevel('o0', 'p', 'mv-removed', 0),
      makeLevel('o1', 'p', 'mv-also-removed', 1),
      makeLevel('o2', 'p', 'mv-third', 2),
    ]
    const newLevels = [makeLevel('n0', 'p', 'mv-a', 0)]
    expect(remapCurrentLevel(2, oldLevels, newLevels)).toBe(0)
  })

  it('returns 0 when new levels is empty', () => {
    const oldLevels = [makeLevel('o0', 'p', 'mv-x', 0)]
    expect(remapCurrentLevel(0, oldLevels, [])).toBe(0)
  })

  it('keeps the same index when movement at that index is unchanged', () => {
    const oldLevels = [
      makeLevel('o0', 'p', 'mv-a', 0),
      makeLevel('o1', 'p', 'mv-b', 1),
    ]
    const newLevels = [
      makeLevel('n0', 'p', 'mv-a', 0),
      makeLevel('n1', 'p', 'mv-b', 1),
      makeLevel('n2', 'p', 'mv-c', 2),
    ]
    expect(remapCurrentLevel(1, oldLevels, newLevels)).toBe(1)
  })
})

describe('seedDatabase movement classification', () => {
  beforeEach(async () => {
    await clearAllTables()
  })

  it('every seeded movement has a family', async () => {
    await seedDatabase()
    const movements = await db.movements.toArray()
    const missing = movements.filter((m) => !m.family)
    expect(missing).toHaveLength(0)
  })

  it('at least one wrist-loaded skill carries the wrist-loaded prep tag', async () => {
    await seedDatabase()
    const movements = await db.movements.toArray()
    const wristLoaded = movements.filter((m) => m.prepTags?.includes('wrist-loaded'))
    expect(wristLoaded.length).toBeGreaterThan(0)
    // Planche family must be among them.
    const tuckPlanche = movements.find((m) => m.name === 'Tuck Planche')
    expect(tuckPlanche?.prepTags).toContain('wrist-loaded')
  })

  it('updates family and prepTags on existing movement rows when they are missing', async () => {
    // Simulate a pre-classification DB row (no family or prepTags).
    await db.movements.add({
      id: 'mv-existing',
      name: 'Pull-Ups',
      createdAt: 0,
    })

    await seedDatabase()

    const updated = await db.movements.get('mv-existing')
    expect(updated?.family).toBe('pull')
    expect(updated?.prepTags).toContain('grip')
  })
})

describe('seedDatabase nutrition (foods + meals)', () => {
  beforeEach(async () => {
    await clearAllTables()
  })

  it('seeds the labelled custom foods and whole-food ingredients', async () => {
    await seedDatabase()
    const foods = await db.customFoods.toArray()
    // The 7 packaged/label foods + 12 whole-food/plan ingredients.
    expect(foods.length).toBeGreaterThanOrEqual(19)
    expect(await db.customFoods.get('seed-food-milk')).toBeTruthy()
    expect(await db.customFoods.get('seed-food-chicken-breast')).toBeTruthy()
    expect((await db.customFoods.get('seed-food-olive-oil'))?.per).toBe('perServing')
  })

  it('is idempotent — re-seeding does not duplicate foods or meals', async () => {
    await seedDatabase()
    const foodsAfterFirst = await db.customFoods.count()
    const mealsAfterFirst = await db.meals.count()
    await seedDatabase()
    expect(await db.customFoods.count()).toBe(foodsAfterFirst)
    expect(await db.meals.count()).toBe(mealsAfterFirst)
  })

  it('does not overwrite a user-edited seeded food on re-seed', async () => {
    await seedDatabase()
    await db.customFoods.update('seed-food-milk', { proteinG: 8 }) // user corrects the label
    await seedDatabase()
    expect((await db.customFoods.get('seed-food-milk'))?.proteinG).toBe(8)
  })

  it('seeds the three cut-plan meals (no snacks meal) totalling ~1,815 kcal / ~161 P', async () => {
    await seedDatabase()
    const meals = await db.meals.toArray()
    const cutMeals = meals.filter((m) => m.id.startsWith('seed-meal-'))
    expect(cutMeals).toHaveLength(3)
    // Snacks are logged loose, not as a meal template.
    expect(cutMeals.map((m) => m.mealLabel).sort()).toEqual(['breakfast', 'dinner', 'lunch'])

    // Sum every ingredient across the three meals — guards against a
    // fat-fingered snapshot value drifting the plan.
    const total = cutMeals
      .flatMap((m) => m.items)
      .reduce(
        (acc, it) => ({
          kcal: acc.kcal + it.kcal,
          proteinG: acc.proteinG + it.proteinG,
          fatG: acc.fatG + it.fatG,
        }),
        { kcal: 0, proteinG: 0, fatG: 0 },
      )

    expect(total.kcal).toBeGreaterThan(1750)
    expect(total.kcal).toBeLessThan(1900)
    expect(total.proteinG).toBeGreaterThan(155)
    expect(total.proteinG).toBeLessThan(170)
    expect(total.fatG).toBeLessThan(65)
  })
})

describe('seedDatabase progression sync', () => {
  beforeEach(async () => {
    await clearAllTables()
  })

  it('rewrites stale progression levels and remaps currentLevel to the same movement', async () => {
    // Simulate a pre-fingerprint database state: Planche Progression exists
    // with the old 5-level shape, user has currentLevel=1 (Tuck Planche).
    // After seedDatabase() runs against the current 7-level seed, the rows
    // should be rewritten and currentLevel remapped to the new Tuck Planche
    // index (2).
    const movements = [
      { id: 'mv-ppp', name: 'Pseudo Planche Push-Ups', createdAt: 0 },
      { id: 'mv-tuck', name: 'Tuck Planche', createdAt: 0 },
      { id: 'mv-adv-tuck', name: 'Advanced Tuck Planche', createdAt: 0 },
      { id: 'mv-straddle', name: 'Straddle Planche', createdAt: 0 },
      { id: 'mv-full', name: 'Full Planche', createdAt: 0 },
    ]
    await db.movements.bulkAdd(movements)

    // No seedFingerprint → triggers rewrite branch.
    await db.progressions.add({
      id: 'p-planche',
      name: 'Planche Progression',
      currentLevel: 1, // pointing at Tuck Planche in the old shape
      createdAt: 0,
    })
    await db.progressionLevels.bulkAdd([
      { id: 'lvl-0', progressionId: 'p-planche', movementId: 'mv-ppp', order: 0, mode: 'reps', defaultTargetReps: 10 },
      { id: 'lvl-1', progressionId: 'p-planche', movementId: 'mv-tuck', order: 1, mode: 'max' },
      { id: 'lvl-2', progressionId: 'p-planche', movementId: 'mv-adv-tuck', order: 2, mode: 'max' },
      { id: 'lvl-3', progressionId: 'p-planche', movementId: 'mv-straddle', order: 3, mode: 'max' },
      { id: 'lvl-4', progressionId: 'p-planche', movementId: 'mv-full', order: 4, mode: 'max' },
    ])

    await seedDatabase()

    const planche = await db.progressions.get('p-planche')
    expect(planche).toBeDefined()
    expect(planche?.seedFingerprint).toBeDefined()

    const levels = await db.progressionLevels
      .where('progressionId').equals('p-planche').sortBy('order')

    // New seed shape: 7 levels (Frog Stand, Straight-Arm Frog Stand, Tuck,
    // Adv Tuck, Straddle, Half-Lay, Full). PPP removed (push-up family, not
    // planche skill); Straight-Arm Frog Stand and Half-Lay Planche added per
    // Atlas spec.
    expect(levels.length).toBe(7)

    // Tuck Planche should now be at index 2 (after Frog Stand, Straight-Arm Frog Stand).
    const tuckLevel = levels.find((l) => l.movementId === 'mv-tuck')
    expect(tuckLevel).toBeDefined()
    expect(tuckLevel?.order).toBe(2)

    // currentLevel should have been remapped from 1 → 2 to keep pointing at Tuck Planche.
    expect(planche?.currentLevel).toBe(2)
  })

  it('does not rewrite when fingerprint matches', async () => {
    // First seed run.
    await seedDatabase()
    const before = await db.progressions.where('name').equals('Planche Progression').first()
    expect(before).toBeDefined()
    const beforeLevels = await db.progressionLevels.where('progressionId').equals(before!.id).toArray()
    const beforeLevelIds = beforeLevels.map((l) => l.id).sort()

    // Simulate user advancing.
    await db.progressions.update(before!.id, { currentLevel: 2 })

    // Second seed run — fingerprint matches, no rewrite should happen.
    await seedDatabase()
    const after = await db.progressions.get(before!.id)
    const afterLevels = await db.progressionLevels.where('progressionId').equals(before!.id).toArray()
    const afterLevelIds = afterLevels.map((l) => l.id).sort()

    // Level row ids should be identical — proves we didn't delete-and-recreate.
    expect(afterLevelIds).toEqual(beforeLevelIds)
    // currentLevel preserved.
    expect(after?.currentLevel).toBe(2)
  })
})
