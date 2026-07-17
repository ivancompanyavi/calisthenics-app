import {
  useProgression,
  useProgressionLevels,
  useUpdateCurrentLevel,
  useSetManuallyUnlocked,
  useClearManuallyUnlocked,
} from '@/hooks/useProgressions'
import { useProgressionGates } from '@/hooks/useProgressionGates'
import { useAdvanceWithAudit } from '@/hooks/useAdvanceWithAudit'
import { DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MovementPhoto } from '@/components/movements/MovementPhoto'
import { ChevronLeft, ChevronRight, Pencil, Lock, LockOpen, Check } from 'lucide-react'
import type { Progression } from '@/models/types'
import { cn } from '@/lib/utils'

interface ProgressionDetailProps {
  progression: Progression
  onEdit: () => void
}

export function ProgressionDetail({ progression: initialProgression, onEdit }: ProgressionDetailProps) {
  const { data: freshProgression } = useProgression(initialProgression.id)
  const progression = freshProgression ?? initialProgression
  const { data: levels } = useProgressionLevels(progression.id)
  const { data: gates } = useProgressionGates()
  const gate = gates?.get(progression.id)
  const updateLevel = useUpdateCurrentLevel()
  const setUnlocked = useSetManuallyUnlocked()
  const clearUnlocked = useClearManuallyUnlocked()
  const { advance } = useAdvanceWithAudit()

  const currentLevel = progression.currentLevel
  const maxLevel = (levels?.length ?? 1) - 1

  const handleLevelChange = async (newLevel: number) => {
    if (newLevel < 0 || newLevel > maxLevel) return
    if (newLevel > currentLevel) {
      // Advancing: run the duplicate-exercise audit before committing.
      await advance(progression.id, currentLevel, newLevel)
    } else {
      // Regressing: no audit needed, commit directly.
      updateLevel.mutate({ id: progression.id, currentLevel: newLevel })
    }
  }

  const currentMovement = levels?.[currentLevel]?.movement

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <DialogTitle className="mb-0">{progression.name}</DialogTitle>
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
      </div>

      {gate && !gate.unlocked && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 space-y-2.5">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Lock className="h-4 w-4" /> Locked — unlock by:
          </div>
          <ul className="space-y-1.5">
            {gate.prerequisites.map((pr, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                {pr.met ? (
                  <Check className="h-3.5 w-3.5 shrink-0 text-green-600" />
                ) : (
                  <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-muted-foreground/40" />
                )}
                <span className={cn('flex-1', pr.met && 'text-muted-foreground line-through')}>
                  {pr.label}
                  {pr.detail ? <span className="text-muted-foreground"> — {pr.detail}</span> : null}
                </span>
                {!pr.met && pr.progress > 0 && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {Math.round(pr.progress * 100)}%
                  </span>
                )}
              </li>
            ))}
          </ul>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setUnlocked.mutate(progression.id)}
            disabled={setUnlocked.isPending}
          >
            Unblock anyway
          </Button>
        </div>
      )}

      {gate?.manuallyUnlocked && (
        <div className="flex items-center justify-between rounded-lg border border-input bg-secondary/40 p-2 text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <LockOpen className="h-3.5 w-3.5" /> Unlocked manually — prerequisites not yet met
          </span>
          <button
            type="button"
            className="underline text-muted-foreground"
            onClick={() => clearUnlocked.mutate(progression.id)}
          >
            Re-lock
          </button>
        </div>
      )}

      {currentMovement && (
        <div className="flex flex-col items-center gap-3">
          <MovementPhoto
            photo={currentMovement.photo}
            seedImagePath={currentMovement.seedImagePath}
            name={currentMovement.name}
            size="lg"
          />
          <p className="font-semibold text-lg">{currentMovement.name}</p>
          {currentMovement.description && (
            <p className="text-sm text-muted-foreground text-center">
              {currentMovement.description}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          disabled={currentLevel === 0}
          onClick={() => handleLevelChange(currentLevel - 1)}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="text-sm font-medium min-w-[80px] text-center">
          Level {currentLevel + 1} / {maxLevel + 1}
        </span>
        <Button
          variant="outline"
          size="icon"
          disabled={currentLevel === maxLevel}
          onClick={() => handleLevelChange(currentLevel + 1)}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          All Levels
        </p>
        {levels?.map((level, i) => (
          <button
            key={level.id}
            onClick={() => handleLevelChange(i)}
            className={cn(
              'w-full flex items-center gap-3 p-2 rounded-lg transition-colors touch-manipulation text-left',
              i === currentLevel
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-secondary'
            )}
          >
            <span className="text-xs font-mono w-6 text-center">{i + 1}</span>
            <span className="text-sm flex-1">{level.movement?.name ?? 'Unknown'}</span>
            {i === currentLevel && (
              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                Current
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
