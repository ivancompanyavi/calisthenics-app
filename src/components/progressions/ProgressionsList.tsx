import { useState } from 'react'
import {
  useProgressions,
  useDeleteProgression,
  useProgressionDiagnostics,
  useProgressionVerdicts,
  useDismissVerdictCard,
  useUpdateCurrentLevel,
} from '@/hooks/useProgressions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { useConfirm } from '@/components/ui/confirm-context'
import { ProgressionForm } from './ProgressionForm'
import { ProgressionDetail } from './ProgressionDetail'
import { Plus, Pencil, Trash2, ChevronRight, Clock, TrendingUp } from 'lucide-react'
import type { Progression } from '@/models/types'

export function ProgressionsList() {
  const { data: progressions, isLoading } = useProgressions()
  const { data: diagnostics } = useProgressionDiagnostics()
  const { data: verdicts } = useProgressionVerdicts()
  const deleteProgression = useDeleteProgression()
  const dismissVerdict = useDismissVerdictCard()
  const advanceLevel = useUpdateCurrentLevel()
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
        const verdict = verdicts?.get(progression.id)
        const showAdvanceCard =
          verdict?.kind === 'ready-to-advance' && !verdict.snoozed
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
              {diag?.stuck && !showAdvanceCard && (
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

          {showAdvanceCard && verdict && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-start gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    Ready to advance
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{verdict.evidence}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    advanceLevel.mutate({
                      id: progression.id,
                      currentLevel: progression.currentLevel + 1,
                    })
                  }}
                  disabled={advanceLevel.isPending}
                >
                  Advance
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    dismissVerdict.mutate({
                      progressionId: progression.id,
                      qualifyingSessionCount: verdict.qualifyingSessionCount,
                    })
                  }}
                  disabled={dismissVerdict.isPending}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}
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
