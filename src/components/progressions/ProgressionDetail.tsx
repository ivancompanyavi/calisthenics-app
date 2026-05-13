import { useProgression, useProgressionLevels, useUpdateCurrentLevel } from '@/hooks/useProgressions'
import { DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MovementPhoto } from '@/components/movements/MovementPhoto'
import { ChevronLeft, ChevronRight, Pencil } from 'lucide-react'
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
  const updateLevel = useUpdateCurrentLevel()

  const currentLevel = progression.currentLevel
  const maxLevel = (levels?.length ?? 1) - 1

  const handleLevelChange = (newLevel: number) => {
    if (newLevel < 0 || newLevel > maxLevel) return
    updateLevel.mutate({ id: progression.id, currentLevel: newLevel })
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
