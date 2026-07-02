export const queryKeys = {
  movements: {
    all: ['movements'] as const,
    detail: (id: string) => ['movements', id] as const,
  },
  progressions: {
    all: ['progressions'] as const,
    detail: (id: string) => ['progressions', id] as const,
    levels: (progressionId: string) => ['progressionLevels', progressionId] as const,
    readiness: (progressionIds: string[], setsCount: number) =>
      ['progressionReadiness', progressionIds, setsCount] as const,
    diagnostics: ['progressionDiagnostics'] as const,
    verdicts: ['progressionVerdicts'] as const,
  },
  workouts: {
    all: ['workouts'] as const,
    detail: (id: string) => ['workouts', id] as const,
    blocks: (workoutId: string) => ['workoutBlocks', workoutId] as const,
    entries: (blockId: string) => ['blockEntries', blockId] as const,
    entriesBulk: (blockIds: string[]) => ['blockEntries', 'bulk', blockIds] as const,
  },
  workoutLogs: {
    all: ['workoutLogs'] as const,
    detail: (id: string) => ['workoutLogs', id] as const,
    sets: (workoutLogId: string) => ['setLogs', workoutLogId] as const,
    allSets: ['setLogs', 'all'] as const,
  },
  programs: {
    all: ['programs'] as const,
    detail: (id: string) => ['programs', id] as const,
    days: (programId: string) => ['programs', programId, 'days'] as const,
    active: ['programs', 'active'] as const,
    currentSlot: ['programs', 'currentSlot'] as const,
    history: (programId: string) => ['programs', programId, 'history'] as const,
    completionStats: (activeProgramId: string) => ['programs', 'completion', activeProgramId] as const,
  },
  insights: ['insights'] as const,
  inProgress: ['inProgressWorkout'] as const,
  prs: ['movementPRs'] as const,
  bodyweight: ['bodyweight'] as const,
  goals: ['goals'] as const,
  settings: ['settings'] as const,
  skills: ['skills'] as const,
} as const
