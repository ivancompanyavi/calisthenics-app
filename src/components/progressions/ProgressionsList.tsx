import { useState } from 'react'
import { useProgressions, useDeleteProgression, useProgressionDiagnostics } from '@/hooks/useProgressions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { useConfirm } from '@/components/ui/confirm-context'
import { ProgressionForm } from './ProgressionForm'
import { ProgressionDetail } from './ProgressionDetail'
import { Plus, Pencil, Trash2, ChevronRight, Clock } from 'lucide-react'
import type { Progression } from '@/models/types'

export function ProgressionsList() {
  const { data: progressions, isLoading } = useProgressions()
  const { data: diagnostics } = useProgressionDiagnostics()
  const deleteProgression = useDeleteProgression()
  const confirm = useConfirm()
  const [editingProgression, setEditingProgression] = useState<Progression | null>(null)
  const [viewingProgression, setViewingProgression] = useState<Progression | null>(null)
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = progressions?.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">Loading...</div>
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Search progressions..."
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
          {search ? 'No progressions match your search.' : 'No progressions yet.'}
        </div>
      )}

      {filtered?.map((progression) => {
        const diag = diagnostics?.get(progression.id)
        return (
        <Card key={progression.id} className="p-3">
          <div className="flex items-center gap-3">
            <button
              className="flex-1 min-w-0 text-left touch-manipulation"
              onClick={() => setViewingProgression(progression)}
            >
              <p className="font-medium truncate">{progression.name}</p>
              <p className="text-xs text-muted-foreground">
                Level {progression.currentLevel + 1} / {progression.levelCount}
              </p>
              {diag?.stuck && (
                <p className="text-[11px] mt-1 inline-flex items-center gap-1 text-amber-500">
                  <Clock className="h-3 w-3" />
                  Stuck — {diag.sessionsAtRung} sessions / {diag.daysAtRung}d at this rung
                </p>
              )}
            </button>
            <div className="flex gap-1 items-center">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setEditingProgression(progression)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-destructive"
                onClick={async () => {
                  if (await confirm({
                    title: `Delete "${progression.name}"?`,
                    confirmLabel: 'Delete',
                    destructive: true,
                  })) {
                    deleteProgression.mutate(progression.id)
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <ChevronRight
                className="h-4 w-4 text-muted-foreground cursor-pointer"
                onClick={() => setViewingProgression(progression)}
              />
            </div>
          </div>
        </Card>
        )
      })}

      <Dialog open={creating} onClose={() => setCreating(false)}>
        <ProgressionForm onDone={() => setCreating(false)} />
      </Dialog>

      <Dialog open={!!editingProgression} onClose={() => setEditingProgression(null)}>
        {editingProgression && (
          <ProgressionForm
            progression={editingProgression}
            onDone={() => setEditingProgression(null)}
          />
        )}
      </Dialog>

      <Dialog open={!!viewingProgression} onClose={() => setViewingProgression(null)}>
        {viewingProgression && (
          <ProgressionDetail
            progression={viewingProgression}
            onEdit={() => {
              setViewingProgression(null)
              setEditingProgression(viewingProgression)
            }}
          />
        )}
      </Dialog>
    </div>
  )
}
