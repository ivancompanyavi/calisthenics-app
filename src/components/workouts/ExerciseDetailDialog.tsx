import { Dialog } from '@/components/ui/dialog'
import { MovementPhoto } from '@/components/movements/MovementPhoto'
import { useWeightUnit } from '@/hooks/useSettings'
import { formatWeight } from '@/lib/units'
import { formatTime, formatTempo } from '@/lib/utils'
import { TrendingUp, Video, Repeat, Clock, AlertTriangle } from 'lucide-react'
import type { ResolvedBlock, ResolvedEntry } from '@/lib/execution-engine'

interface ExerciseDetailDialogProps {
  open: boolean
  onClose: () => void
  entry: ResolvedEntry | null
  block: ResolvedBlock | null
  blockIndex: number | null
}

// Larger-format view of a single block entry — opened from WorkoutDetail when
// the user taps a row. Shows everything the compact list truncates: full
// coaching cues, full description, complete prescription (target / tempo /
// weight / band / gate), and the surrounding block context.
export function ExerciseDetailDialog({
  open,
  onClose,
  entry,
  block,
  blockIndex,
}: ExerciseDetailDialogProps) {
  const unit = useWeightUnit()

  if (!entry || !block) return null

  const sideLabel = entry.perSide ? ' /side' : ''
  const target = formatTargetVerbose(entry, sideLabel)

  return (
    <Dialog open={open} onClose={onClose}>
      <div className="flex flex-col items-center gap-4">
        <MovementPhoto
          photo={entry.movementPhoto}
          seedImagePath={entry.movementSeedImagePath}
          name={entry.movementName}
          size="lg"
          className="h-32 w-32"
        />

        <div className="text-center">
          <h2 className="text-2xl font-bold">{entry.movementName}</h2>
          {entry.progressionId && entry.progressionName && (
            <p className="text-xs text-primary inline-flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3" />
              {entry.progressionName} · Lvl {entry.progressionCurrentLevel}/
              {entry.progressionLevelCount}
            </p>
          )}
        </div>
      </div>

      {/* Block context — rounds + rest + position in workout */}
      {blockIndex != null && (
        <div className="mt-5 rounded-lg bg-secondary/50 px-3 py-2 text-xs text-muted-foreground flex flex-wrap gap-3">
          <span className="font-medium text-foreground">
            Block {blockIndex + 1}
            {block.type === 'superset' ? ' · superset' : ''}
          </span>
          <span className="inline-flex items-center gap-1">
            <Repeat className="h-3 w-3" /> {block.rounds} round
            {block.rounds === 1 ? '' : 's'}
          </span>
          {(entry.restSeconds ?? block.restSeconds) > 0 && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />{' '}
              {formatTime(entry.restSeconds ?? block.restSeconds)} rest
              {entry.restSeconds != null && entry.restSeconds !== block.restSeconds
                ? ' (override)'
                : ''}
            </span>
          )}
        </div>
      )}

      {/* Target prescription — the main number(s) the user will hit */}
      <section className="mt-4">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Target
        </p>
        <p className="text-3xl font-bold font-mono tabular-nums">{target}</p>
        {entry.suggestedReps != null && entry.suggestedReps !== entry.targetReps && (
          <p className="text-xs text-primary mt-1">
            ↑ bumped from {entry.targetReps}
            {entry.suggestedRepsReason ? ` — ${entry.suggestedRepsReason}` : ''}
          </p>
        )}
      </section>

      {/* Chips: tempo, weight, band */}
      {(entry.tempo ||
        entry.targetWeightKg != null ||
        entry.targetBandLevel != null) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {entry.tempo && (
            <Chip label="Tempo">
              <span className="font-mono tabular-nums">
                {formatTempo(entry.tempo)}
              </span>
            </Chip>
          )}
          {entry.targetWeightKg != null && (
            <Chip label="Weight">
              <span className="font-mono tabular-nums">
                {formatWeight(entry.targetWeightKg, unit)}
              </span>
            </Chip>
          )}
          {entry.targetBandLevel != null && (
            <Chip label="Band">
              <span className="font-mono tabular-nums">
                Level {entry.targetBandLevel}
              </span>
            </Chip>
          )}
        </div>
      )}

      {/* Gate — pre-flight question the engine will ask before running this */}
      {entry.gate && (
        <section className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
          <p className="text-[10px] uppercase tracking-wider text-amber-500/90 inline-flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Pre-flight gate
          </p>
          <p className="text-sm mt-1">{entry.gate.question}</p>
          {entry.gate.skipOnNo && (
            <p className="text-[11px] text-muted-foreground mt-1">
              Answering No skips this exercise.
            </p>
          )}
        </section>
      )}

      {/* Description */}
      {entry.movementDescription && (
        <section className="mt-5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Description
          </p>
          <p className="text-sm mt-1">{entry.movementDescription}</p>
        </section>
      )}

      {/* Coaching cues — full text, not truncated */}
      {entry.movementCoachingCues && (
        <section className="mt-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Coaching cues
          </p>
          <p className="text-sm mt-1 italic text-muted-foreground whitespace-pre-line">
            {entry.movementCoachingCues}
          </p>
        </section>
      )}

      {/* Form check link */}
      {entry.movementReferenceUrl && (
        <a
          href={entry.movementReferenceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <Video className="h-4 w-4" />
          Form check
        </a>
      )}
    </Dialog>
  )
}

function Chip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-secondary/50 px-3 py-1 text-xs">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

function formatTargetVerbose(entry: ResolvedEntry, sideLabel: string): string {
  if (entry.mode === 'time') {
    return entry.targetSeconds ? formatTime(entry.targetSeconds) : 'Hold'
  }
  if (entry.mode === 'max') {
    return 'Max hold'
  }
  const reps = entry.suggestedReps ?? entry.targetReps
  return reps != null ? `${reps} reps${sideLabel}` : 'reps'
}
