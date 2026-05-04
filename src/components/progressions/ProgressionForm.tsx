import { useState, useEffect } from 'react'
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
import type { Progression } from '@/models/types'

interface ProgressionFormProps {
  progression?: Progression
  onDone: () => void
}

export function ProgressionForm({ progression, onDone }: ProgressionFormProps) {
  const [name, setName] = useState(progression?.name ?? '')
  const [selectedMovementIds, setSelectedMovementIds] = useState<string[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [pickerSearch, setPickerSearch] = useState('')

  const { data: allMovements } = useMovements()
  const { data: existingLevels } = useProgressionLevels(progression?.id)
  const createProgression = useCreateProgression()
  const updateProgression = useUpdateProgression()
  const isEditing = !!progression

  useEffect(() => {
    if (existingLevels && isEditing) {
      setSelectedMovementIds(existingLevels.map((l) => l.movementId))
    }
  }, [existingLevels, isEditing])

  const selectedMovements = selectedMovementIds
    .map((id) => allMovements?.find((m) => m.id === id))
    .filter(Boolean)

  const availableMovements = allMovements?.filter(
    (m) =>
      !selectedMovementIds.includes(m.id) &&
      m.name.toLowerCase().includes(pickerSearch.toLowerCase())
  )

  const handleAddMovement = (movementId: string) => {
    setSelectedMovementIds((prev) => [...prev, movementId])
    setShowPicker(false)
    setPickerSearch('')
  }

  const handleRemoveMovement = (movementId: string) => {
    setSelectedMovementIds((prev) => prev.filter((id) => id !== movementId))
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    setSelectedMovementIds((prev) => {
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next
    })
  }

  const handleMoveDown = (index: number) => {
    if (index === selectedMovementIds.length - 1) return
    setSelectedMovementIds((prev) => {
      const next = [...prev]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || selectedMovementIds.length === 0) return

    if (isEditing) {
      await updateProgression.mutateAsync({
        id: progression.id,
        name: name.trim(),
        movementIds: selectedMovementIds,
      })
    } else {
      await createProgression.mutateAsync({
        name: name.trim(),
        movementIds: selectedMovementIds,
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
          Movements ({selectedMovementIds.length})
        </label>
        <p className="text-xs text-muted-foreground">
          Order from easiest (top) to hardest (bottom)
        </p>

        <div className="space-y-1">
          {selectedMovements.map((movement, i) => (
            <div
              key={movement!.id}
              className="flex items-center gap-2 p-2 rounded-lg bg-secondary"
            >
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
                  disabled={i === selectedMovementIds.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30 touch-manipulation"
                >
                  <GripVertical className="h-3 w-3 rotate-90" />
                </button>
              </div>
              <span className="text-xs font-mono text-muted-foreground w-5">
                {i + 1}
              </span>
              <span className="text-sm flex-1">{movement!.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveMovement(movement!.id)}
                className="text-muted-foreground hover:text-destructive touch-manipulation p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
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
        disabled={!name.trim() || selectedMovementIds.length === 0}
      >
        {isEditing ? 'Save Changes' : 'Create Progression'}
      </Button>
    </form>
  )
}
