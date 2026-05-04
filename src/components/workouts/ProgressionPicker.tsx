import { useState } from 'react'
import { useProgressions, useProgressionLevels } from '@/hooks/useProgressions'
import { DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { MovementPhoto } from '@/components/movements/MovementPhoto'

interface ProgressionPickerProps {
  onSelect: (progressionId: string) => void
}

function ProgressionRow({ progressionId, name, currentLevel, onSelect }: {
  progressionId: string
  name: string
  currentLevel: number
  onSelect: () => void
}) {
  const { data: levels } = useProgressionLevels(progressionId)
  const currentMovement = levels?.[currentLevel]?.movement

  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors touch-manipulation text-left"
    >
      <MovementPhoto
        photo={currentMovement?.photo}
        name={name}
        size="sm"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{name}</p>
        {currentMovement && (
          <p className="text-xs text-muted-foreground truncate">
            Current: {currentMovement.name}
            {levels && levels.length > 1 && ` (Lvl ${currentLevel + 1}/${levels.length})`}
          </p>
        )}
      </div>
    </button>
  )
}

export function ProgressionPicker({ onSelect }: ProgressionPickerProps) {
  const { data: progressions } = useProgressions()
  const [search, setSearch] = useState('')

  const filtered = progressions?.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-3">
      <DialogTitle>Select Exercise</DialogTitle>
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search progressions..."
        autoFocus
      />
      <div className="max-h-64 overflow-y-auto -mx-2">
        {filtered?.map((p) => (
          <ProgressionRow
            key={p.id}
            progressionId={p.id}
            name={p.name}
            currentLevel={p.currentLevel}
            onSelect={() => onSelect(p.id)}
          />
        ))}
        {filtered?.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No progressions found. Add movements and progressions in the Library first.
          </p>
        )}
      </div>
    </div>
  )
}
