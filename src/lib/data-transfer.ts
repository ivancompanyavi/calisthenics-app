import { db } from '@/db'

export async function exportAllData(): Promise<string> {
  const [movements, progressions, progressionLevels, workouts, workoutBlocks, blockEntries, workoutLogs, setLogs, programs, programDays, activePrograms] =
    await Promise.all([
      db.movements.toArray(),
      db.progressions.toArray(),
      db.progressionLevels.toArray(),
      db.workouts.toArray(),
      db.workoutBlocks.toArray(),
      db.blockEntries.toArray(),
      db.workoutLogs.toArray(),
      db.setLogs.toArray(),
      db.programs.toArray(),
      db.programDays.toArray(),
      db.activePrograms.toArray(),
    ])

  const movementsWithoutBlobs = movements.map(({ photo, ...rest }) => ({
    ...rest,
    hasPhoto: !!photo,
  }))

  const data = {
    version: 2,
    exportedAt: new Date().toISOString(),
    movements: movementsWithoutBlobs,
    progressions,
    progressionLevels,
    workouts,
    workoutBlocks,
    blockEntries,
    workoutLogs,
    setLogs,
    programs,
    programDays,
    activePrograms,
  }

  return JSON.stringify(data, null, 2)
}

export async function importAllData(json: string): Promise<void> {
  const data = JSON.parse(json)

  if (!data.version || !data.movements) {
    throw new Error('Invalid backup file format')
  }

  await db.transaction(
    'rw',
    [db.movements, db.progressions, db.progressionLevels, db.workouts, db.workoutBlocks, db.blockEntries, db.workoutLogs, db.setLogs, db.programs, db.programDays, db.activePrograms],
    async () => {
      await db.movements.clear()
      await db.progressions.clear()
      await db.progressionLevels.clear()
      await db.workouts.clear()
      await db.workoutBlocks.clear()
      await db.blockEntries.clear()
      await db.workoutLogs.clear()
      await db.setLogs.clear()
      await db.programs.clear()
      await db.programDays.clear()
      await db.activePrograms.clear()

      if (data.movements.length > 0) {
        const movements = data.movements.map(({ hasPhoto: _hasPhoto, ...rest }: Record<string, unknown>) => rest)
        await db.movements.bulkAdd(movements)
      }
      if (data.progressions.length > 0) await db.progressions.bulkAdd(data.progressions)
      if (data.progressionLevels.length > 0) await db.progressionLevels.bulkAdd(data.progressionLevels)
      if (data.workouts.length > 0) await db.workouts.bulkAdd(data.workouts)
      if (data.workoutBlocks.length > 0) await db.workoutBlocks.bulkAdd(data.workoutBlocks)
      if (data.blockEntries.length > 0) await db.blockEntries.bulkAdd(data.blockEntries)
      if (data.workoutLogs.length > 0) await db.workoutLogs.bulkAdd(data.workoutLogs)
      if (data.setLogs.length > 0) await db.setLogs.bulkAdd(data.setLogs)
      if (data.programs?.length > 0) await db.programs.bulkAdd(data.programs)
      if (data.programDays?.length > 0) await db.programDays.bulkAdd(data.programDays)
      if (data.activePrograms?.length > 0) await db.activePrograms.bulkAdd(data.activePrograms)
    }
  )
}

export function downloadJson(json: string, filename: string) {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
