import { useState } from 'react'
import {
  useProgressions,
  useDeleteProgression,
  useProgressionVerdicts,
} from '@/hooks/useProgressions'
import { useProgressionGates } from '@/hooks/useProgressionGates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { useConfirm } from '@/components/ui/confirm-context'
import { ProgressionForm } from './ProgressionForm'
import { ProgressionDetail } from './ProgressionDetail'
import { AdvanceSuggestionCard } from './AdvanceSuggestionCard'
import { RegressingSuggestionCard } from './RegressingSuggestionCard'
import { StuckActionCard } from './StuckActionCard'
import { Plus, Pencil, Trash2, ChevronRight, Lock } from 'lucide-react'
import type { Progression } from '@/models/types'

export function ProgressionsList() {
  const { data: progressions, isLoading } = useProgressions()
  const { data: verdicts } = useProgressionVerdicts()
  const { data: gates } = useProgressionGates()
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
        const verdict = verdicts?.get(progression.id)
        const showAdvanceCard =
          verdict?.kind === 'ready-to-advance' && !verdict.snoozed
        const showRegressingCard =
          verdict?.kind === 'regressing' && !verdict.snoozed
        const showStuckCard =
          verdict?.kind === 'stuck'
        const gate = gates?.get(progression.id)
        const locked = gate ? !gate.unlocked : false
        return (
          <div key={progression.id} className="space-y-2">
            <Card className="p-3">
              <div className="flex items-center gap-3">
                <button
                  className="flex-1 min-w-0 text-left touch-manipulation"
                  onClick={() => setViewingProgression(progression)}
                >
                  <p className="font-medium truncate flex items-center gap-1.5">
                    {locked && <Lock className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
                    <span className="truncate">{progression.name}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Level {progression.currentLevel + 1} / {progression.levelCount}
                    {locked && <span className="text-amber-500"> · Locked</span>}
                  </p>
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

            {showAdvanceCard && verdict && (
              <AdvanceSuggestionCard progression={progression} verdict={verdict} />
            )}
            {showRegressingCard && verdict && (
              <RegressingSuggestionCard progression={progression} verdict={verdict} />
            )}
            {showStuckCard && verdict && (
              <StuckActionCard
                progression={progression}
                verdict={verdict}
                onSwapVariant={() => setEditingProgression(progression)}
              />
            )}
          </div>
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
