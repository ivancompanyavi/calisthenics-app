import { useState } from 'react'
import type { DraftEntry } from '@/pages/WorkoutBuilder'
import { useProgression, useProgressionLevels } from '@/hooks/useProgressions'
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
  const { data: progression } = useProgression(entry.progressionId)
  const { data: levels } = useProgressionLevels(entry.progressionId)
  const [showRest, setShowRest] = useState(!!entry.restSeconds)

  const currentMovement = levels?.[progression?.currentLevel ?? 0]?.movement

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {currentMovement?.name ?? progression?.name ?? 'Loading...'}
          </p>
          {progression && levels && levels.length > 1 && (
            <p className="text-xs text-muted-foreground">
              Lvl {(progression.currentLevel ?? 0) + 1}/{levels.length}
            </p>
          )}
        </div>

        <select
          value={entry.mode}
          onChange={(e) => {
            const mode = e.target.value as 'reps' | 'time' | 'max'
            onUpdate({
              mode,
              targetReps: mode === 'reps' ? 10 : undefined,
              targetSeconds: mode === 'time' ? 30 : undefined,
            })
          }}
          className="h-9 rounded-md border border-input bg-transparent px-2 text-xs"
        >
          <option value="reps">Reps</option>
          <option value="time">Time</option>
          <option value="max">Max Hold</option>
        </select>

        {entry.mode === 'reps' && (
          <Input
            type="number"
            min={1}
            value={entry.targetReps ?? 10}
            onChange={(e) => onUpdate({ targetReps: Math.max(1, parseInt(e.target.value) || 1) })}
            className="h-9 w-16 text-center"
          />
        )}
        {entry.mode === 'time' && (
          <Input
            type="number"
            min={5}
            step={5}
            value={entry.targetSeconds ?? 30}
            onChange={(e) => onUpdate({ targetSeconds: Math.max(5, parseInt(e.target.value) || 5) })}
            className="h-9 w-16 text-center"
          />
        )}

        <span className="text-xs text-muted-foreground w-6">
          {entry.mode === 'reps' ? 'rep' : entry.mode === 'time' ? 'sec' : ''}
        </span>

        {entry.mode === 'reps' && (
          <button
            type="button"
            onClick={() => onUpdate({ perSide: !entry.perSide })}
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
              entry.perSide
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
