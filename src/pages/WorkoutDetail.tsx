import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useWorkout, useWorkoutBlocks, useAllBlockEntries } from '@/hooks/useWorkouts'
import { progressionsRepository, workoutsRepository } from '@/repositories'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MovementPhoto } from '@/components/movements/MovementPhoto'
import { ExerciseDetailDialog } from '@/components/workouts/ExerciseDetailDialog'
import { ArrowLeft, Pencil, Play, TrendingUp, Lock } from 'lucide-react'
import { useProgressionGates } from '@/hooks/useProgressionGates'
import { SubstitutionNote } from '@/components/workouts/SubstitutionNote'
import { UpgradeSuggestionCard } from '@/components/workouts/UpgradeSuggestionCard'
import { formatTime, formatTempo } from '@/lib/utils'
import { queryKeys } from '@/lib/query-keys'
import type { ResolvedBlock, ResolvedEntry } from '@/lib/execution-engine'
import type { UpgradeSuggestion } from '@/lib/session-adaptation'

function formatTarget(entry: ResolvedEntry): string {
  const sideLabel = entry.perSide ? ' /side' : ''
  if (entry.mode === 'time') {
    return entry.targetSeconds ? formatTime(entry.targetSeconds) : 'Hold'
  }
  if (entry.mode === 'max') {
    return 'Max hold'
  }
  // Prefer the auto-suggested target when present so the preview matches
  // what the execution UI will show.
  const reps = entry.suggestedReps ?? entry.targetReps
  return reps != null ? `${reps} reps${sideLabel}` : 'reps'
}

function formatBlockMeta(block: ResolvedBlock): string {
  const parts = [`${block.rounds} round${block.rounds === 1 ? '' : 's'}`]
  if (block.restSeconds > 0) {
    parts.push(`${formatTime(block.restSeconds)} rest`)
  }
  return parts.join(' · ')
}

export function WorkoutDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: workout } = useWorkout(id)
  const { data: blocks } = useWorkoutBlocks(id)
  const blockIds = blocks?.map((b) => b.id) ?? []
  const { data: entries } = useAllBlockEntries(blockIds)
  const { data: gates } = useProgressionGates()

  const queryClient = useQueryClient()
  const [resolved, setResolved] = useState<ResolvedBlock[] | null>(null)
  const [upgrades, setUpgrades] = useState<UpgradeSuggestion[]>([])
  const [detail, setDetail] = useState<{
    entry: ResolvedEntry
    block: ResolvedBlock
    blockIndex: number
  } | null>(null)

  const resolve = useCallback(() => {
    if (!blocks || !entries) return
    workoutsRepository.resolveBlocksDetailed(blocks, entries).then((detailed) => {
      setResolved(detailed.blocks)
      setUpgrades(detailed.upgradeSuggestions)
    })
  }, [blocks, entries])

  useEffect(resolve, [resolve])

  // Adopt/dismiss both persist on the progression row, then re-resolve so the
  // preview reflects the choice immediately.
  const onUpgradeAction = async (
    action: (id: string) => Promise<void>,
    progressionId: string,
  ) => {
    await action(progressionId)
    await queryClient.invalidateQueries({ queryKey: queryKeys.progressions.all })
    resolve()
  }

  if (!workout) {
    return (
      <div>
        <PageHeader title="Workout">
          <Button variant="ghost" size="sm" onClick={() => navigate('/workouts')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </PageHeader>
        <div className="px-4 py-8 text-center text-muted-foreground">Loading...</div>
      </div>
    )
  }

  const totalExercises = resolved?.reduce(
    (sum, b) => sum + b.entries.length * b.rounds,
    0,
  ) ?? 0

  return (
    <div>
      <PageHeader title={workout.name}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/workouts')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </PageHeader>

      <div className="px-4 space-y-4 pb-24">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {resolved
                ? `${resolved.length} block${resolved.length === 1 ? '' : 's'} · ${totalExercises} sets`
                : 'Loading...'}
            </p>
            {workout.restBetweenBlocksSeconds ? (
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatTime(workout.restBetweenBlocksSeconds)} between blocks
              </p>
            ) : null}
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/workouts/${id}/edit`)}
            >
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button size="sm" onClick={() => navigate(`/execute/${id}`)}>
              <Play className="h-4 w-4 mr-1" />
              Start
            </Button>
          </div>
        </div>

        <ExerciseDetailDialog
          open={detail != null}
          onClose={() => setDetail(null)}
          entry={detail?.entry ?? null}
          block={detail?.block ?? null}
          blockIndex={detail?.blockIndex ?? null}
        />

        {upgrades.map((suggestion) => (
          <UpgradeSuggestionCard
            key={suggestion.progressionId}
            suggestion={suggestion}
            onAdopt={(id) => onUpgradeAction(progressionsRepository.adopt, id)}
            onDismiss={(id) => onUpgradeAction(progressionsRepository.dismissUpgrade, id)}
          />
        ))}

        {resolved?.map((block, blockIdx) => (
          <section key={blockIdx} className="space-y-2">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold">
                Block {blockIdx + 1}
                <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {block.type === 'superset' ? 'Superset' : 'Set'}
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">{formatBlockMeta(block)}</p>
            </div>
            <Card className="p-2">
              <ul className="divide-y divide-border">
                {block.entries.map((entry, entryIdx) => (
                  <li key={entryIdx}>
                    <button
                      type="button"
                      onClick={() => setDetail({ entry, block, blockIndex: blockIdx })}
                      className="flex items-center gap-3 py-2 px-1 w-full text-left rounded-md transition-colors hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <MovementPhoto
                        photo={entry.movementPhoto}
                        seedImagePath={entry.movementSeedImagePath}
                        name={entry.movementName}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{entry.movementName}</p>
                        {entry.progressionId && entry.progressionName && (
                          <p className="text-[10px] text-primary flex items-center gap-1 mt-0.5">
                            <TrendingUp className="h-3 w-3 shrink-0" />
                            <span className="truncate">
                              {entry.progressionName} · Lvl {entry.progressionCurrentLevel}/{entry.progressionLevelCount}
                            </span>
                          </p>
                        )}
                        {entry.movementCoachingCues && (
                          <p className="text-xs text-muted-foreground truncate italic">
                            {entry.movementCoachingCues}
                          </p>
                        )}
                        <div className="flex gap-2 mt-0.5 flex-wrap">
                          {entry.tempo && (
                            <span className="text-[10px] font-mono tabular-nums text-muted-foreground">
                              Tempo {formatTempo(entry.tempo)}
                            </span>
                          )}
                          {entry.gate && (
                            <span className="text-[10px] text-amber-500/90">
                              ⚠ gated
                            </span>
                          )}
                          {entry.substitutedFor && (
                            <SubstitutionNote substitutedFor={entry.substitutedFor} />
                          )}
                          {entry.progressionId &&
                            gates?.get(entry.progressionId) &&
                            !gates.get(entry.progressionId)!.unlocked && (
                              <span className="text-[10px] text-amber-500 flex items-center gap-0.5">
                                <Lock className="h-2.5 w-2.5" /> locked
                              </span>
                            )}
                          {entry.suggestedReps != null && entry.suggestedReps !== entry.targetReps && (
                            <span className="text-[10px] text-primary">
                              ↑ from {entry.targetReps}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm tabular-nums text-muted-foreground whitespace-nowrap">
                        {formatTarget(entry)}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        ))}
      </div>
    </div>
  )
}
