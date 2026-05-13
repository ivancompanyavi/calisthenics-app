import { useState } from 'react'
import { useProgressions, useProgressionLevels } from '@/hooks/useProgressions'
import { useMovements } from '@/hooks/useMovements'
import { DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { MovementPhoto } from '@/components/movements/MovementPhoto'

export type ExerciseSelection =
  | { type: 'progression'; progressionId: string }
  | { type: 'movement'; movementId: string }

interface ExercisePickerProps {
  onSelect: (selection: ExerciseSelection) => void
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
        seedImagePath={currentMovement?.seedImagePath}
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

export function ExercisePicker({ onSelect }: ExercisePickerProps) {
  const { data: progressions } = useProgressions()
  const { data: movements } = useMovements()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'progressions' | 'movements'>('progressions')

  const filteredProgressions = progressions?.filter((p) =>
    p.levelCount > 1 && p.name.toLowerCase().includes(search.toLowerCase())
  )

  const filteredMovements = movements?.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-3">
      <DialogTitle>Select Exercise</DialogTitle>
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search..."
        autoFocus
      />

      <div className="flex gap-1 border-b">
        <button
          type="button"
          onClick={() => setTab('progressions')}
          className={`px-3 py-1.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === 'progressions'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground'
          }`}
        >
          Progressions
        </button>
        <button
          type="button"
          onClick={() => setTab('movements')}
          className={`px-3 py-1.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === 'movements'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground'
          }`}
        >
          Movements
        </button>
      </div>

      <div className="max-h-64 overflow-y-auto -mx-2">
        {tab === 'progressions' && (
          <>
            {filteredProgressions?.map((p) => (
              <ProgressionRow
                key={p.id}
                progressionId={p.id}
                name={p.name}
                currentLevel={p.currentLevel}
                onSelect={() => onSelect({ type: 'progression', progressionId: p.id })}
              />
            ))}
            {filteredProgressions?.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No progressions found.
              </p>
            )}
          </>
        )}

        {tab === 'movements' && (
          <>
            {filteredMovements?.map((m) => (
              <button
                key={m.id}
                onClick={() => onSelect({ type: 'movement', movementId: m.id })}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors touch-manipulation text-left"
              >
                <MovementPhoto
                  photo={m.photo}
                  seedImagePath={m.seedImagePath}
                  name={m.name}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.name}</p>
                  {m.description && (
                    <p className="text-xs text-muted-foreground truncate">{m.description}</p>
                  )}
                </div>
              </button>
            ))}
            {filteredMovements?.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No movements found. Add movements in the Library first.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
