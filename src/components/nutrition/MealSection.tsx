import { FoodLogRow } from '@/components/nutrition/FoodLogRow'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { MEAL_TITLES } from '@/lib/nutrition'
import type { FoodLog, MealLabel } from '@/models/types'

interface LogGroup {
  /** Set when these entries were logged together from a meal template. */
  mealInstanceId?: string
  logs: FoodLog[]
}

// Groups a section's entries: consecutive runs sharing a mealInstanceId become
// one group (a meal logged as a unit); everything else is its own singleton.
// Preserves original order.
function groupLogs(logs: FoodLog[]): LogGroup[] {
  const groups: LogGroup[] = []
  for (const log of logs) {
    const prev = groups[groups.length - 1]
    if (log.mealInstanceId && prev?.mealInstanceId === log.mealInstanceId) {
      prev.logs.push(log)
    } else {
      groups.push({ mealInstanceId: log.mealInstanceId, logs: [log] })
    }
  }
  return groups
}

export function MealSection({
  meal,
  logs,
  onEdit,
  onDelete,
  onDeleteGroup,
}: {
  meal: MealLabel | 'unlabeled'
  logs: FoodLog[]
  onEdit: (log: FoodLog) => void
  onDelete: (log: FoodLog) => void
  onDeleteGroup: (mealInstanceId: string, count: number) => void
}) {
  if (logs.length === 0) return null

  const kcal = logs.reduce((sum, l) => sum + l.kcal, 0)
  const groups = groupLogs(logs)

  return (
    <section>
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="text-sm font-semibold">{MEAL_TITLES[meal]}</h3>
        <span className="text-xs text-muted-foreground tabular-nums">{Math.round(kcal)} kcal</span>
      </div>
      <div className="space-y-2">
        {groups.map((group) =>
          // A multi-item meal group gets a wrapper with a "remove all"; single
          // entries (and 1-item groups) render as plain rows.
          group.mealInstanceId && group.logs.length > 1 ? (
            <div key={group.mealInstanceId} className="rounded-lg border border-border/60 p-1.5 space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] text-muted-foreground">Logged as a meal</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-destructive"
                  onClick={() => onDeleteGroup(group.mealInstanceId!, group.logs.length)}
                >
                  <Trash2 className="h-3 w-3 mr-1" /> Remove all
                </Button>
              </div>
              {group.logs.map((log) => (
                <FoodLogRow key={log.id} log={log} onEdit={() => onEdit(log)} onDelete={() => onDelete(log)} />
              ))}
            </div>
          ) : (
            group.logs.map((log) => (
              <FoodLogRow key={log.id} log={log} onEdit={() => onEdit(log)} onDelete={() => onDelete(log)} />
            ))
          ),
        )}
      </div>
    </section>
  )
}
