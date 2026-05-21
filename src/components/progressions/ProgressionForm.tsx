import { useState } from 'react'
import {
  useCreateProgression,
  useUpdateProgression,
  useProgressionLevels,
} from '@/hooks/useProgressions'
import { useMovements } from '@/hooks/useMovements'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DialogTitle } from '@/components/ui/dialog'
import { GripVertical, Plus, X } from 'lucide-react'
import type { Progression, SetMode } from '@/models/types'

interface DraftLevel {
  movementId: string
  mode: SetMode
  defaultTargetReps?: number
  defaultTargetSeconds?: number
  perSide?: boolean
}

interface ProgressionFormProps {
  progression?: Progression
  onDone: () => void
}

// Outer loader: when editing, waits for existingLevels before mounting the
// form. The inner component derives its useState initial values from props in
// one shot, so we don't need a hydration effect.
export function ProgressionForm({ progression, onDone }: ProgressionFormProps) {
  const isEditing = !!progression
  const { data: existingLevels } = useProgressionLevels(progression?.id)

  if (isEditing && !existingLevels) return null

  const initialLevels: DraftLevel[] = existingLevels?.map((l) => ({
    movementId: l.movementId,
    mode: l.mode,
    defaultTargetReps: l.defaultTargetReps,
    defaultTargetSeconds: l.defaultTargetSeconds,
    perSide: l.perSide,
  })) ?? []

  return (
    <ProgressionFormInner
      progression={progression}
      initialLevels={initialLevels}
      onDone={onDone}
    />
  )
}

interface ProgressionFormInnerProps {
  progression?: Progression
  initialLevels: DraftLevel[]
  onDone: () => void
}

function ProgressionFormInner({ progression, initialLevels, onDone }: ProgressionFormInnerProps) {
  const [name, setName] = useState(progression?.name ?? '')
  const [levels, setLevels] = useState<DraftLevel[]>(initialLevels)
  const [showPicker, setShowPicker] = useState(false)
  const [pickerSearch, setPickerSearch] = useState('')

  const { data: allMovements } = useMovements()
  const createProgression = useCreateProgression()
  const updateProgression = useUpdateProgression()
  const isEditing = !!progression

  const selectedMovementIds = levels.map((l) => l.movementId)

  const availableMovements = allMovements?.filter(
    (m) =>
      !selectedMovementIds.includes(m.id) &&
      m.name.toLowerCase().includes(pickerSearch.toLowerCase())
  )

  const handleAddMovement = (movementId: string) => {
    setLevels((prev) => [...prev, { movementId, mode: 'reps', defaultTargetReps: 10 }])
    setShowPicker(false)
    setPickerSearch('')
  }

  const handleRemoveLevel = (index: number) => {
    setLevels((prev) => prev.filter((_, i) => i !== index))
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    setLevels((prev) => {
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next
    })
  }

  const handleMoveDown = (index: number) => {
    if (index === levels.length - 1) return
    setLevels((prev) => {
      const next = [...prev]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      return next
    })
  }

  const updateLevel = (index: number, updates: Partial<DraftLevel>) => {
    setLevels((prev) => prev.map((l, i) => i === index ? { ...l, ...updates } : l))
  }

  const handleModeChange = (index: number, mode: SetMode) => {
    updateLevel(index, {
      mode,
      defaultTargetReps: mode === 'reps' ? 10 : undefined,
      defaultTargetSeconds: mode === 'time' ? 30 : undefined,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || levels.length === 0) return

    if (isEditing) {
      await updateProgression.mutateAsync({
        id: progression.id,
        name: name.trim(),
        levels,
      })
    } else {
      await createProgression.mutateAsync({
        name: name.trim(),
        levels,
      })
    }
    onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogTitle>{isEditing ? 'Edit Progression' : 'New Progression'}</DialogTitle>

      <div className="space-y-2">
        <label className="text-sm font-medium">Name *</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Push-Up Progression"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Levels ({levels.length})
        </label>
        <p className="text-xs text-muted-foreground">
          Order from easiest (top) to hardest (bottom). Set the mode for each level.
        </p>

        <div className="space-y-2">
          {levels.map((level, i) => {
            const movement = allMovements?.find((m) => m.id === level.movementId)
            return (
              <div
                key={`${level.movementId}-${i}`}
                className="p-2 rounded-lg bg-secondary space-y-2"
              >
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => handleMoveUp(i)}
                      disabled={i === 0}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30 touch-manipulation"
                    >
                      <GripVertical className="h-3 w-3 rotate-90 scale-x-[-1]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveDown(i)}
                      disabled={i === levels.length - 1}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30 touch-manipulation"
                    >
                      <GripVertical className="h-3 w-3 rotate-90" />
                    </button>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground w-5">
                    {i + 1}
                  </span>
                  <span className="text-sm flex-1 font-medium">{movement?.name ?? 'Unknown'}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveLevel(i)}
                    className="text-muted-foreground hover:text-destructive touch-manipulation p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 pl-8">
                  <select
                    value={level.mode}
                    onChange={(e) => handleModeChange(i, e.target.value as SetMode)}
                    className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
                  >
                    <option value="reps">Reps</option>
                    <option value="time">Time</option>
                    <option value="max">Max Hold</option>
                  </select>

                  {level.mode === 'reps' && (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={1}
                        value={level.defaultTargetReps ?? ''}
                        onChange={(e) => updateLevel(i, { defaultTargetReps: parseInt(e.target.value) || undefined })}
                        placeholder="10"
                        className="h-8 w-14 text-center text-xs"
                      />
                      <span className="text-xs text-muted-foreground">reps</span>
                    </div>
                  )}

                  {level.mode === 'time' && (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={5}
                        step={5}
                        value={level.defaultTargetSeconds ?? ''}
                        onChange={(e) => updateLevel(i, { defaultTargetSeconds: parseInt(e.target.value) || undefined })}
                        placeholder="30"
                        className="h-8 w-14 text-center text-xs"
                      />
                      <span className="text-xs text-muted-foreground">sec</span>
                    </div>
                  )}

                  {level.mode === 'reps' && (
                    <button
                      type="button"
                      onClick={() => updateLevel(i, { perSide: !level.perSide })}
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                        level.perSide
                          ? 'bg-primary/20 border-primary text-primary'
                          : 'border-input text-muted-foreground'
                      }`}
                    >
                      /side
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {showPicker ? (
          <div className="space-y-2 border rounded-lg p-3">
            <Input
              value={pickerSearch}
              onChange={(e) => setPickerSearch(e.target.value)}
              placeholder="Search movements..."
              autoFocus
            />
            <div className="max-h-48 overflow-y-auto space-y-1">
              {availableMovements?.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleAddMovement(m.id)}
                  className="w-full text-left text-sm p-2 rounded-lg hover:bg-secondary transition-colors touch-manipulation"
                >
                  {m.name}
                </button>
              ))}
              {availableMovements?.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No movements available
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowPicker(false)
                setPickerSearch('')
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPicker(true)}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Movement
          </Button>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={!name.trim() || levels.length === 0}
      >
        {isEditing ? 'Save Changes' : 'Create Progression'}
      </Button>
    </form>
  )
}
