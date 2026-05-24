import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useGoals, useCreateGoal, useDeleteGoal } from '@/hooks/useGoals'
import { useMovements } from '@/hooks/useMovements'
import { useMovementPRs } from '@/hooks/useHistory'
import { Target, Trash2, Plus, Check, X } from 'lucide-react'
import type { Goal } from '@/models/types'

// Home-screen goals widget. Each goal pins a movement + target (reps or
// seconds). Progress is computed live from the movement's PR — no separate
// "completed" state, since PRs may continue improving past the target.
export function GoalsCard() {
  const { data: goals = [] } = useGoals()
  const { data: movements = [] } = useMovements()
  const { data: prs } = useMovementPRs()
  const createGoal = useCreateGoal()
  const deleteGoal = useDeleteGoal()
  const [adding, setAdding] = useState(false)

  const movementById = new Map(movements.map((m) => [m.id, m]))

  if (goals.length === 0 && !adding) {
    return (
      <Card className="p-3">
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="w-full flex items-center gap-3 text-left"
        >
          <Target className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Set a goal</span>
        </button>
      </Card>
    )
  }

  return (
    <Card className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <Target className="h-4 w-4 text-primary" /> Goals
        </h3>
        {!adding && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7"
            onClick={() => setAdding(true)}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add
          </Button>
        )}
      </div>

      {goals.length > 0 && (
        <ul className="space-y-2">
          {goals.map((goal) => {
            const movement = movementById.get(goal.movementId)
            const pr = prs?.get(goal.movementId)
            const current = goal.targetReps != null ? pr?.bestReps ?? 0 : pr?.bestSeconds ?? 0
            const target = goal.targetReps ?? goal.targetSeconds ?? 1
            const pct = Math.min(100, Math.round((current / target) * 100))
            const unit = goal.targetReps != null ? 'reps' : 's'
            const achieved = current >= target
            return (
              <li key={goal.id} className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {movement?.name ?? 'Unknown movement'}
                    </p>
                    <p className="text-[11px] text-muted-foreground tabular-nums">
                      {current}{unit} / {target}{unit}
                      {goal.deadline && (
                        <span className="ml-2">
                          by {new Date(goal.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                  {achieved && <Check className="h-4 w-4 text-green-500 shrink-0" />}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive"
                    onClick={() => deleteGoal.mutate(goal.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="h-1 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={
                      achieved
                        ? 'h-full bg-green-500'
                        : 'h-full bg-primary'
                    }
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {adding && (
        <GoalForm
          movements={movements}
          onCancel={() => setAdding(false)}
          onCreate={async (data) => {
            await createGoal.mutateAsync(data)
            setAdding(false)
          }}
        />
      )}
    </Card>
  )
}

interface GoalFormProps {
  movements: Array<{ id: string; name: string }>
  onCancel: () => void
  onCreate: (data: Omit<Goal, 'id' | 'createdAt'>) => void | Promise<void>
}

// Lightweight inline form. Mode picker drives whether targetReps or
// targetSeconds is saved — a goal carries one or the other, never both.
function GoalForm({ movements, onCancel, onCreate }: GoalFormProps) {
  const [movementId, setMovementId] = useState('')
  const [mode, setMode] = useState<'reps' | 'seconds'>('reps')
  const [target, setTarget] = useState('')
  const [deadline, setDeadline] = useState('')

  const submit = () => {
    const value = Number(target)
    if (!movementId || !Number.isFinite(value) || value <= 0) return
    const deadlineMs = deadline ? new Date(deadline).getTime() : undefined
    onCreate({
      movementId,
      targetReps: mode === 'reps' ? value : undefined,
      targetSeconds: mode === 'seconds' ? value : undefined,
      deadline: deadlineMs,
    })
  }

  return (
    <div className="space-y-2 pt-1">
      <select
        value={movementId}
        onChange={(e) => setMovementId(e.target.value)}
        className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
      >
        <option value="">Pick a movement</option>
        {movements.map((m) => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </select>
      <div className="flex gap-2">
        <div className="flex rounded-md border border-input overflow-hidden">
          <button
            type="button"
            onClick={() => setMode('reps')}
            className={
              mode === 'reps'
                ? 'px-3 h-9 text-xs bg-primary text-primary-foreground'
                : 'px-3 h-9 text-xs text-muted-foreground'
            }
          >
            reps
          </button>
          <button
            type="button"
            onClick={() => setMode('seconds')}
            className={
              mode === 'seconds'
                ? 'px-3 h-9 text-xs bg-primary text-primary-foreground'
                : 'px-3 h-9 text-xs text-muted-foreground'
            }
          >
            sec
          </button>
        </div>
        <Input
          type="number"
          inputMode="numeric"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="Target"
          className="h-9 text-sm flex-1"
        />
      </div>
      <Input
        type="date"
        value={deadline}
        onChange={(e) => setDeadline(e.target.value)}
        className="h-9 text-sm"
        placeholder="Deadline (optional)"
      />
      <div className="flex gap-2">
        <Button size="sm" className="h-8 flex-1" onClick={submit} disabled={!movementId || !target}>
          <Check className="h-4 w-4 mr-1" />
          Save
        </Button>
        <Button size="sm" variant="ghost" className="h-8" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
