import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useConfirm } from '@/components/ui/confirm-context'
import { ChevronLeft, ChevronRight, Plus, Target, BookOpen, Ruler, Copy, LineChart } from 'lucide-react'
import { useFoodLogsForDay, useDayTotals, useDeleteFoodLog, useCopyDay } from '@/hooks/useFoodLog'
import { useCurrentNutritionTarget } from '@/hooks/useNutritionTargets'
import { DaySummaryCard } from '@/components/nutrition/DaySummaryCard'
import { MealSection } from '@/components/nutrition/MealSection'
import { MEAL_ORDER } from '@/lib/nutrition'
import { AddFoodDialog } from '@/components/nutrition/AddFoodDialog'
import { EditFoodLogDialog } from '@/components/nutrition/EditFoodLogDialog'
import { CustomFoodsDialog } from '@/components/nutrition/CustomFoodsDialog'
import { TargetDialog } from '@/components/nutrition/TargetDialog'
import type { FoodLog } from '@/models/types'

function startOfDay(date: number): number {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

const DAY_MS = 24 * 60 * 60 * 1000

export function Nutrition() {
  const navigate = useNavigate()
  const confirm = useConfirm()

  const [selectedDate, setSelectedDate] = useState(() => startOfDay(Date.now()))
  // Captured once at mount rather than read fresh on every render — Date.now()
  // is impure under React's rules. Same pattern as BodyweightCard.tsx; "Today"
  // can go stale if the page stays open across midnight, which is fine here.
  const [now] = useState(() => Date.now())
  const [addOpen, setAddOpen] = useState(false)
  const [editingLog, setEditingLog] = useState<FoodLog | null>(null)
  const [customFoodsOpen, setCustomFoodsOpen] = useState(false)
  const [targetOpen, setTargetOpen] = useState(false)

  const { data: logs } = useFoodLogsForDay(selectedDate)
  const { data: totals } = useDayTotals(selectedDate)
  const { data: target } = useCurrentNutritionTarget()
  const deleteFoodLog = useDeleteFoodLog()
  const copyDay = useCopyDay()

  const grouped = useMemo(() => {
    const map: Record<string, FoodLog[]> = {}
    for (const log of logs ?? []) {
      const key = log.mealLabel ?? 'unlabeled'
      ;(map[key] ??= []).push(log)
    }
    return map
  }, [logs])

  const isToday = startOfDay(now) === selectedDate
  const dateLabel = isToday
    ? 'Today'
    : new Date(selectedDate).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })

  const handleDelete = async (log: FoodLog) => {
    if (
      await confirm({
        title: 'Delete this entry?',
        description: `Remove "${log.name}" from this day's log? This can't be undone.`,
        confirmLabel: 'Delete',
        destructive: true,
      })
    ) {
      deleteFoodLog.mutate(log.id)
    }
  }

  const isEmpty = (logs?.length ?? 0) === 0

  const handleCopyYesterday = async () => {
    const fromDate = selectedDate - DAY_MS
    if (
      await confirm({
        title: 'Copy yesterday?',
        description: "Clone yesterday's entries into this day's log.",
        confirmLabel: 'Copy',
      })
    ) {
      copyDay.mutate({ fromDate, toDate: selectedDate })
    }
  }

  return (
    <div>
      <PageHeader title="Nutrition">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => navigate('/nutrition/trends')} aria-label="Trends">
            <LineChart className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setTargetOpen(true)} aria-label="Set target">
            <Target className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setCustomFoodsOpen(true)} aria-label="Custom foods">
            <BookOpen className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate('/measurements')} aria-label="Measurements">
            <Ruler className="h-4 w-4" />
          </Button>
        </div>
      </PageHeader>

      <div className="px-4 space-y-4 pb-24">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedDate((d) => d - DAY_MS)}
            aria-label="Previous day"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">{dateLabel}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedDate((d) => d + DAY_MS)}
            aria-label="Next day"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <DaySummaryCard totals={totals} target={target} />

        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add food
          </Button>
          {!isEmpty && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyYesterday}
              disabled={copyDay.isPending}
              aria-label="Copy yesterday"
              title="Copy yesterday"
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}
        </div>

        {isEmpty ? (
          <Card className="p-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">Nothing logged for this day yet.</p>
            {!target && (
              <p className="text-xs text-muted-foreground">
                Set a target to track progress, or just log what you eat.
              </p>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleCopyYesterday}
              disabled={copyDay.isPending}
            >
              <Copy className="h-4 w-4 mr-1" /> Copy yesterday
            </Button>
          </Card>
        ) : (
          MEAL_ORDER.map((meal) => (
            <MealSection
              key={meal}
              meal={meal}
              logs={grouped[meal] ?? []}
              onEdit={setEditingLog}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      <AddFoodDialog open={addOpen} onClose={() => setAddOpen(false)} date={selectedDate} />
      <EditFoodLogDialog log={editingLog} onClose={() => setEditingLog(null)} />
      <CustomFoodsDialog open={customFoodsOpen} onClose={() => setCustomFoodsOpen(false)} />
      <TargetDialog open={targetOpen} onClose={() => setTargetOpen(false)} />
    </div>
  )
}
