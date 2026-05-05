import { useState } from 'react'
import type { DraftEntry, SetMode } from '@/models/types'
import { useProgression, useProgressionLevels } from '@/hooks/useProgressions'
import { useMovement } from '@/hooks/useMovements'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Timer, ChevronUp, ChevronDown } from 'lucide-react'

interface EntryRowProps {
  entry: DraftEntry
  index: number
  totalEntries: number
  onUpdate: (updates: Partial<DraftEntry>) => void
  onRemove: () => void
  onMove: (direction: 'up' | 'down') => void
}

export function EntryRow({ entry, index, totalEntries, onUpdate, onRemove, onMove }: EntryRowProps) {
  const isStandalone = !!entry.movementId
  const { data: progression } = useProgression(entry.progressionId)
  const { data: levels } = useProgressionLevels(entry.progressionId)
  const { data: standaloneMovement } = useMovement(entry.movementId)
  const [showRest, setShowRest] = useState(!!entry.restSeconds)

  const currentLevelIndex = progression?.currentLevel ?? 0
  const currentLevel = levels?.[currentLevelIndex]

  const displayName = isStandalone
    ? standaloneMovement?.name ?? 'Loading...'
    : currentLevel?.movement?.name ?? progression?.name ?? 'Loading...'

  const mode: SetMode = isStandalone
    ? entry.mode ?? 'reps'
    : currentLevel?.mode ?? 'reps'

  const modeBadgeLabel = mode === 'reps' ? 'Reps' : mode === 'time' ? 'Time' : 'Max'

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{displayName}</p>
          <div className="flex items-center gap-1.5">
            {!isStandalone && progression && levels && levels.length > 1 && (
              <p className="text-xs text-muted-foreground">
                Lvl {currentLevelIndex + 1}/{levels.length}
              </p>
            )}
            {isStandalone ? (
              <select
                value={mode}
                onChange={(e) => {
                  const newMode = e.target.value as SetMode
                  onUpdate({
                    mode: newMode,
                    targetReps: newMode === 'reps' ? (entry.targetReps ?? 10) : undefined,
                    targetSeconds: newMode === 'time' ? (entry.targetSeconds ?? 30) : undefined,
                  })
                }}
                className="h-5 rounded border border-input bg-transparent px-1 text-[10px] font-medium"
              >
                <option value="reps">Reps</option>
                <option value="time">Time</option>
                <option value="max">Max</option>
              </select>
            ) : (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                {modeBadgeLabel}
              </span>
            )}
          </div>
        </div>

        {mode === 'reps' && (
          <Input
            type="number"
            min={1}
            value={entry.targetReps ?? ''}
            onChange={(e) => onUpdate({ targetReps: parseInt(e.target.value) || undefined })}
            placeholder={isStandalone ? '10' : String(currentLevel?.defaultTargetReps ?? 10)}
            className="h-9 w-16 text-center"
          />
        )}
        {mode === 'time' && (
          <Input
            type="number"
            min={5}
            step={5}
            value={entry.targetSeconds ?? ''}
            onChange={(e) => onUpdate({ targetSeconds: parseInt(e.target.value) || undefined })}
            placeholder={isStandalone ? '30' : String(currentLevel?.defaultTargetSeconds ?? 30)}
            className="h-9 w-16 text-center"
          />
        )}

        {mode !== 'max' && (
          <span className="text-xs text-muted-foreground w-6">
            {mode === 'reps' ? 'rep' : 'sec'}
          </span>
        )}

        {mode === 'reps' && (
          <button
            type="button"
            onClick={() => onUpdate({ perSide: !entry.perSide })}
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
              entry.perSide ?? (!isStandalone && currentLevel?.perSide)
                ? 'bg-primary/20 border-primary text-primary'
                : 'border-input text-muted-foreground'
            }`}
          >
            /side
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            if (showRest) {
              onUpdate({ restSeconds: undefined })
              setShowRest(false)
            } else {
              setShowRest(true)
            }
          }}
          className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
            showRest
              ? 'bg-primary/20 border-primary text-primary'
              : 'border-input text-muted-foreground'
          }`}
          title="Custom rest override"
        >
          <Timer className="h-3 w-3" />
        </button>

        {totalEntries > 1 && (
          <div className="flex flex-col">
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-5"
              disabled={index === 0}
              onClick={() => onMove('up')}
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-5"
              disabled={index === totalEntries - 1}
              onClick={() => onMove('down')}
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 flex-shrink-0"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {showRest && (
        <div className="flex items-center gap-2 pl-2 text-xs text-muted-foreground">
          <Timer className="h-3 w-3" />
          <span>Rest:</span>
          <Input
            type="number"
            min={5}
            step={5}
            value={entry.restSeconds ?? 60}
            onChange={(e) => onUpdate({ restSeconds: Math.max(5, parseInt(e.target.value) || 60) })}
            className="h-7 w-16 text-center text-xs"
          />
          <span>sec</span>
        </div>
      )}
    </div>
  )
}
