import { ArrowLeft, ArrowUp, ArrowDown, Play, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MovementPhoto } from '@/components/movements/MovementPhoto'
import { formatTime, formatTempo } from '@/lib/utils'
import type { ResolvedBlock, ResolvedEntry } from '@/lib/execution-engine'

interface SessionPreviewScreenProps {
  workoutName: string
  blocks: ResolvedBlock[]
  isLoading: boolean
  isResume: boolean
  onStart: () => void
  onBack: () => void
  onReorderEntry: (blockIndex: number, fromIndex: number, toIndex: number) => void
}

function formatTarget(entry: ResolvedEntry): string {
  const sideLabel = entry.perSide ? ' /side' : ''
  if (entry.mode === 'time') {
    return entry.targetSeconds ? formatTime(entry.targetSeconds) : 'Hold'
  }
  if (entry.mode === 'max') {
    return 'Max hold'
  }
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

export function SessionPreviewScreen({
  workoutName,
  blocks,
  isLoading,
  isResume,
  onStart,
  onBack,
  onReorderEntry,
}: SessionPreviewScreenProps) {
  return (
    <div className="min-h-dvh flex flex-col bg-background safe-top">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-base font-semibold truncate mx-2 flex-1 text-center">{workoutName}</h1>
        <div className="w-16" />
      </div>

      {/* Scrollable block list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-32 space-y-4">
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Loading...</p>
        ) : blocks.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No exercises found.</p>
        ) : (
          blocks.map((block, blockIdx) => (
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
                    <li key={entryIdx} className="flex items-center gap-1 py-1">
                      {/* Reorder controls — only show for supersets with multiple entries */}
                      {block.entries.length > 1 && (
                        <div className="flex flex-col gap-0.5 shrink-0">
                          <button
                            type="button"
                            disabled={entryIdx === 0}
                            onClick={() => onReorderEntry(blockIdx, entryIdx, entryIdx - 1)}
                            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary/60 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                            aria-label={`Move ${entry.movementName} up`}
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={entryIdx === block.entries.length - 1}
                            onClick={() => onReorderEntry(blockIdx, entryIdx, entryIdx + 1)}
                            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary/60 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                            aria-label={`Move ${entry.movementName} down`}
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Entry info — mirrors WorkoutDetail layout */}
                      <div className="flex items-center gap-3 flex-1 min-w-0 px-1 py-1">
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
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          ))
        )}
      </div>

      {/* Fixed bottom start button */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-safe-bottom py-4 bg-background/95 backdrop-blur border-t border-border">
        <Button
          size="lg"
          className="w-full text-lg"
          disabled={isLoading}
          onClick={onStart}
        >
          <Play className="h-5 w-5 mr-2" />
          {isResume ? 'Resume Workout' : 'Start Workout'}
        </Button>
      </div>
    </div>
  )
}
