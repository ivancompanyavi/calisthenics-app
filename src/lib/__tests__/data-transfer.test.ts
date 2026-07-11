import '../../repositories/__tests__/setup'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/db'
import { clearAllTables } from '../../repositories/__tests__/setup'
import { exportAllData, exportForSync, importAllData } from '../data-transfer'

describe('data-transfer', () => {
  beforeEach(async () => {
    await clearAllTables()
  })

  describe('importAllData validation', () => {
    it('rejects non-JSON input without touching the database', async () => {
      await db.movements.add({ id: 'm-existing', name: 'Existing', createdAt: 0 })
      await expect(importAllData('not json')).rejects.toThrow(/not valid JSON/)
      // Existing data preserved.
      expect(await db.movements.count()).toBe(1)
    })

    it('rejects unsupported version', async () => {
      await db.movements.add({ id: 'm-existing', name: 'Existing', createdAt: 0 })
      const payload = JSON.stringify({ version: 1, movements: [] })
      await expect(importAllData(payload)).rejects.toThrow(/unsupported version/)
      expect(await db.movements.count()).toBe(1)
    })

    it('rejects rows missing required id field before clearing', async () => {
      await db.movements.add({ id: 'm-existing', name: 'Existing', createdAt: 0 })
      const payload = JSON.stringify({
        version: 3,
        movements: [{ name: 'No id here' }],
        progressions: [], progressionLevels: [], workouts: [], workoutBlocks: [],
        blockEntries: [], workoutLogs: [], setLogs: [],
      })
      await expect(importAllData(payload)).rejects.toThrow(/missing required string id/)
      expect(await db.movements.count()).toBe(1)
      // Critically: existing record is untouched, not replaced by half-import.
      expect((await db.movements.get('m-existing'))?.name).toBe('Existing')
    })

    it('rejects blockEntries with no discriminator', async () => {
      const payload = JSON.stringify({
        version: 3,
        movements: [], progressions: [], progressionLevels: [], workouts: [], workoutBlocks: [],
        // Bad row: no kind, no legacy progressionId or movementId
        blockEntries: [{ id: 'e1', blockId: 'b1', order: 0 }],
        workoutLogs: [], setLogs: [],
      })
      await expect(importAllData(payload)).rejects.toThrow(/blockEntries\[0\] must specify kind/)
    })

    it('backfills kind for v2 backups (no kind field, legacy progressionId/movementId)', async () => {
      const payload = JSON.stringify({
        version: 2,
        movements: [{ id: 'm1', name: 'Push-Up', createdAt: 0 }],
        progressions: [],
        progressionLevels: [],
        workouts: [{ id: 'w1', name: 'W', createdAt: 0 }],
        workoutBlocks: [{ id: 'b1', workoutId: 'w1', type: 'set', order: 0, rounds: 1, restSeconds: 30 }],
        blockEntries: [
          { id: 'e1', blockId: 'b1', order: 0, movementId: 'm1', mode: 'reps', targetReps: 10 },
        ],
        workoutLogs: [],
        setLogs: [],
      })
      await importAllData(payload)
      const entry = await db.blockEntries.get('e1')
      expect(entry).toBeDefined()
      expect(entry?.kind).toBe('movement')
    })
  })

  describe('round-trip', () => {
    it('preserves entity rows across export → clear → import', async () => {
      await db.movements.add({ id: 'm1', name: 'Push-Up', createdAt: 100 })
      await db.workouts.add({ id: 'w1', name: 'Routine', createdAt: 200, seedFingerprint: 'fp1' })
      await db.workoutBlocks.add({ id: 'b1', workoutId: 'w1', type: 'set', order: 0, rounds: 3, restSeconds: 60 })
      await db.blockEntries.add({
        id: 'e1', blockId: 'b1', order: 0, kind: 'movement', movementId: 'm1', mode: 'reps', targetReps: 10,
      })

      const json = await exportAllData()
      await clearAllTables()
      await importAllData(json)

      expect((await db.movements.get('m1'))?.name).toBe('Push-Up')
      expect((await db.workouts.get('w1'))?.seedFingerprint).toBe('fp1')
      const entry = await db.blockEntries.get('e1')
      expect(entry?.kind).toBe('movement')
      if (entry?.kind === 'movement') {
        expect(entry.movementId).toBe('m1')
        expect(entry.mode).toBe('reps')
      }
    })

    it('round-trips bodyweight + goals rows', async () => {
      await db.bodyweightLogs.add({ id: 'bw1', date: 1_700_000_000_000, kg: 75.5 })
      await db.bodyweightLogs.add({ id: 'bw2', date: 1_700_604_800_000, kg: 75.3, notes: 'morning' })
      await db.goals.add({ id: 'g1', movementId: 'm1', targetReps: 10, createdAt: 1_700_000_000_000 })

      const json = await exportAllData()
      await clearAllTables()
      await importAllData(json)

      expect(await db.bodyweightLogs.count()).toBe(2)
      expect((await db.bodyweightLogs.get('bw1'))?.kg).toBe(75.5)
      expect((await db.bodyweightLogs.get('bw2'))?.notes).toBe('morning')
      expect(await db.goals.count()).toBe(1)
      expect((await db.goals.get('g1'))?.targetReps).toBe(10)
    })

    it('imports older v3 backups without bodyweight/goals (treated as empty)', async () => {
      const payload = JSON.stringify({
        version: 3,
        movements: [{ id: 'm1', name: 'Push-Up', createdAt: 0 }],
        progressions: [], progressionLevels: [], workouts: [], workoutBlocks: [],
        blockEntries: [], workoutLogs: [], setLogs: [],
      })
      await importAllData(payload)
      expect(await db.movements.count()).toBe(1)
      expect(await db.bodyweightLogs.count()).toBe(0)
      expect(await db.goals.count()).toBe(0)
    })

    it('round-trips a photo Blob via base64 encoding', async () => {
      const photoBytes = new Uint8Array([1, 2, 3, 4, 5, 0xff, 0xfe])
      const photo = new Blob([photoBytes], { type: 'image/webp' })
      await db.movements.add({ id: 'm1', name: 'WithPhoto', createdAt: 0, photo })

      const json = await exportAllData()
      await clearAllTables()
      await importAllData(json)

      const restored = await db.movements.get('m1')
      expect(restored?.photo).toBeInstanceOf(Blob)
      expect(restored?.photo?.type).toBe('image/webp')
      const restoredBytes = new Uint8Array(await restored!.photo!.arrayBuffer())
      expect(Array.from(restoredBytes)).toEqual(Array.from(photoBytes))
    })
  })

  describe('nutrition tracker round-trip (v6)', () => {
    it('round-trips customFoods, foodLogs, measurements, and nutritionTargets', async () => {
      await db.customFoods.add({
        id: 'cf1', name: 'Chicken Breast', per: 'per100g',
        kcal: 165, proteinG: 31, carbG: 0, fatG: 3.6, fiberG: 0, createdAt: 1_700_000_000_000,
      })
      await db.foodLogs.add({
        id: 'fl1', date: 1_700_000_000_000, loggedAt: 1_700_003_600_000,
        mealLabel: 'lunch', source: 'custom', refId: 'cf1', name: 'Chicken Breast',
        quantityG: 150, kcal: 248, proteinG: 46.5, carbG: 0, fatG: 5.4, fiberG: 0,
      })
      await db.measurements.add({
        id: 'ms1', date: 1_700_000_000_000, waistCm: 80, bodyFatPct: 14.5, source: 'tape',
      })
      await db.nutritionTargets.add({
        id: 'nt1', effectiveDate: 1_700_000_000_000, kcal: 2200, proteinG: 160, setBy: 'coach',
      })

      const json = await exportAllData()
      await clearAllTables()
      await importAllData(json)

      expect((await db.customFoods.get('cf1'))?.name).toBe('Chicken Breast')
      expect((await db.foodLogs.get('fl1'))?.mealLabel).toBe('lunch')
      expect((await db.foodLogs.get('fl1'))?.quantityG).toBe(150)
      expect((await db.measurements.get('ms1'))?.waistCm).toBe(80)
      expect((await db.measurements.get('ms1'))?.bodyFatPct).toBe(14.5)
      expect((await db.nutritionTargets.get('nt1'))?.proteinG).toBe(160)
    })

    it('round-trips the same four tables through exportForSync', async () => {
      await db.customFoods.add({
        id: 'cf1', name: 'Oats', per: 'per100g',
        kcal: 389, proteinG: 17, carbG: 66, fatG: 7, fiberG: 10, createdAt: 0,
      })
      await db.measurements.add({ id: 'ms1', date: 1_700_000_000_000, waistCm: 80 })

      const json = await exportForSync()
      await clearAllTables()
      await importAllData(json)

      expect((await db.customFoods.get('cf1'))?.name).toBe('Oats')
      expect((await db.measurements.get('ms1'))?.waistCm).toBe(80)
    })

    it('reports EXPORT_VERSION as 6', async () => {
      const parsed = JSON.parse(await exportAllData())
      expect(parsed.version).toBe(6)
    })

    it('accepts a v6 import payload containing all four nutrition tables', async () => {
      const payload = JSON.stringify({
        version: 6,
        movements: [], progressions: [], progressionLevels: [], workouts: [], workoutBlocks: [],
        blockEntries: [], workoutLogs: [], setLogs: [],
        customFoods: [{
          id: 'cf1', name: 'Rice', per: 'per100g',
          kcal: 130, proteinG: 3, carbG: 28, fatG: 0, fiberG: 0, createdAt: 0,
        }],
        foodLogs: [{
          id: 'fl1', date: 1_700_000_000_000, loggedAt: 1_700_000_000_000,
          source: 'usda', name: 'Rice', kcal: 130, proteinG: 3, carbG: 28, fatG: 0, fiberG: 0,
        }],
        measurements: [{ id: 'ms1', date: 1_700_000_000_000, waistCm: 81 }],
        nutritionTargets: [{ id: 'nt1', effectiveDate: 1_700_000_000_000, kcal: 2100, proteinG: 165, setBy: 'user' }],
      })

      await importAllData(payload)

      expect(await db.customFoods.count()).toBe(1)
      expect(await db.foodLogs.count()).toBe(1)
      expect(await db.measurements.count()).toBe(1)
      expect(await db.nutritionTargets.count()).toBe(1)
    })

    it('treats nutrition tables as optional when importing a pre-v6 backup', async () => {
      const payload = JSON.stringify({
        version: 5,
        movements: [{ id: 'm1', name: 'Push-Up', createdAt: 0 }],
        progressions: [], progressionLevels: [], workouts: [], workoutBlocks: [],
        blockEntries: [], workoutLogs: [], setLogs: [],
      })

      await importAllData(payload)

      expect(await db.movements.count()).toBe(1)
      expect(await db.customFoods.count()).toBe(0)
      expect(await db.foodLogs.count()).toBe(0)
      expect(await db.measurements.count()).toBe(0)
      expect(await db.nutritionTargets.count()).toBe(0)
    })
  })

  describe('exportForSync', () => {
    it('excludes movement photos entirely (no blob, no base64, no hasPhoto flag)', async () => {
      const photo = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/webp' })
      await db.movements.add({ id: 'm1', name: 'WithPhoto', createdAt: 0, photo })

      const json = await exportForSync()
      const parsed = JSON.parse(json)

      expect(parsed.movements).toHaveLength(1)
      const movement = parsed.movements[0]
      expect(movement.id).toBe('m1')
      expect(movement.name).toBe('WithPhoto')
      expect(movement).not.toHaveProperty('photo')
      expect(movement).not.toHaveProperty('photoBase64')
      expect(movement).not.toHaveProperty('hasPhoto')
    })

    it('matches exportAllData\'s version and non-movement field shape', async () => {
      await db.workouts.add({ id: 'w1', name: 'Routine', createdAt: 200, seedFingerprint: 'fp1' })
      await db.bodyweightLogs.add({ id: 'bw1', date: 1_700_000_000_000, kg: 75.5 })

      const full = JSON.parse(await exportAllData())
      const sync = JSON.parse(await exportForSync())

      expect(sync.version).toBe(full.version)
      expect(sync.workouts).toEqual(full.workouts)
      expect(sync.bodyweightLogs).toEqual(full.bodyweightLogs)
      expect(typeof sync.exportedAt).toBe('string')
    })

    it('produces a payload importAllData can still consume (movements just lack photos)', async () => {
      await db.movements.add({ id: 'm1', name: 'NoPhoto', createdAt: 0 })
      await db.workouts.add({ id: 'w1', name: 'Routine', createdAt: 200 })

      const json = await exportForSync()
      await clearAllTables()
      await importAllData(json)

      expect((await db.movements.get('m1'))?.name).toBe('NoPhoto')
      expect((await db.workouts.get('w1'))?.name).toBe('Routine')
    })
  })
})
