import { useState } from 'react'
import { useMovements, useDeleteMovement } from '@/hooks/useMovements'
import { useMovementPRs } from '@/hooks/useHistory'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { useConfirm } from '@/components/ui/confirm-context'
import { MovementForm } from './MovementForm'
import { Plus, Pencil, Trash2, Trophy } from 'lucide-react'
import type { Movement } from '@/models/types'
import { MovementPhoto } from './MovementPhoto'

export function MovementsList() {
  const { data: movements, isLoading } = useMovements()
  const { data: prs } = useMovementPRs()
  const deleteMovement = useDeleteMovement()
  const confirm = useConfirm()
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null)
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = movements?.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">Loading...</div>
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Search movements..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Button size="icon" onClick={() => setCreating(true)}>
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {filtered?.length === 0 && (
        <div className="py-8 text-center text-muted-foreground text-sm">
          {search ? 'No movements match your search.' : 'No movements yet.'}
        </div>
      )}

      {filtered?.map((movement) => {
        const pr = prs?.get(movement.id)
        return (
        <Card key={movement.id} className="p-3">
          <div className="flex items-center gap-3">
            <MovementPhoto
              photo={movement.photo}
              seedImagePath={movement.seedImagePath}
              name={movement.name}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{movement.name}</p>
              {movement.description && (
                <p className="text-xs text-muted-foreground truncate">{movement.description}</p>
              )}
              {(pr?.bestReps != null || pr?.bestSeconds != null) && (
                <p className="text-[11px] mt-1 flex items-center gap-1 text-amber-400/90">
                  <Trophy className="h-3 w-3 shrink-0" />
                  <span className="font-mono tabular-nums">
                    PR
                    {pr.bestReps != null && ` ${pr.bestReps} reps`}
                    {pr.bestReps != null && pr.bestSeconds != null && ' ·'}
                    {pr.bestSeconds != null && ` ${pr.bestSeconds}s`}
                  </span>
                </p>
              )}
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setEditingMovement(movement)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-destructive"
                onClick={async () => {
                  if (await confirm({
                    title: `Delete "${movement.name}"?`,
                    confirmLabel: 'Delete',
                    destructive: true,
                  })) {
                    deleteMovement.mutate(movement.id)
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
        )
      })}

      <Dialog open={creating} onClose={() => setCreating(false)}>
        <MovementForm onDone={() => setCreating(false)} />
      </Dialog>

      <Dialog open={!!editingMovement} onClose={() => setEditingMovement(null)}>
        {editingMovement && (
          <MovementForm
            movement={editingMovement}
            onDone={() => setEditingMovement(null)}
          />
        )}
      </Dialog>
    </div>
  )
}
