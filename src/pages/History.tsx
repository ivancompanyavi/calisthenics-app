import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkoutLogs, useDeleteWorkoutLog, useAllSetLogs } from '@/hooks/useHistory'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useConfirm } from '@/components/ui/confirm-context'
import { InsightsPanel } from '@/components/history/InsightsPanel'
import { TrainingHeatmap } from '@/components/history/TrainingHeatmap'
import { buildHeatmapGrid, toLocalDateKey } from '@/lib/heatmap'
import { Clock, ChevronRight, Trash2 } from 'lucide-react'

export function History() {
  const navigate = useNavigate()
  const { data: logs, isLoading } = useWorkoutLogs()
  const { data: setLogs } = useAllSetLogs()
  const deleteLog = useDeleteWorkoutLog()
  const confirm = useConfirm()

  // Heatmap tap-to-filter state: null means "show all"
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Build the heatmap grid from all workout + set logs
  const heatmapGrid = useMemo(
    () => buildHeatmapGrid(logs ?? [], setLogs ?? []),
    [logs, setLogs],
  )

  // Group logs by local date, optionally filtered by the heatmap selection.
  const groupedByDate = useMemo(() => {
    if (!logs) return undefined

    // When a date is selected, only include logs for that day
    const filtered = selectedDate
      ? logs.filter((log) => toLocalDateKey(log.completedAt) === selectedDate)
      : logs

    return filtered.reduce<Record<string, typeof logs>>((acc, log) => {
      const date = new Date(log.completedAt).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      if (!acc[date]) acc[date] = []
      acc[date].push(log)
      return acc
    }, {})
  }, [logs, selectedDate])

  return (
    <div>
      <PageHeader title="History" />

      <div className="px-4 space-y-6 pb-8">
        <InsightsPanel />

        <TrainingHeatmap
          grid={heatmapGrid}
          selectedDate={selectedDate}
          onDaySelect={setSelectedDate}
        />

        {isLoading && (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        )}

        {!isLoading && (!logs || logs.length === 0) && (
          <div className="py-12 text-center">
            <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No workouts completed yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Complete a workout to see it here.
            </p>
          </div>
        )}

        {/* Empty state when a date is selected but has no workouts */}
        {!isLoading &&
          selectedDate &&
          groupedByDate &&
          Object.keys(groupedByDate).length === 0 && (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No workouts logged on this day.
            </div>
          )}

        {groupedByDate &&
          Object.entries(groupedByDate).map(([date, dateLogs]) => (
            <section key={date}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">{date}</h3>
              <div className="space-y-2">
                {dateLogs.map((log) => {
                  const duration = Math.round(
                    (log.completedAt - log.startedAt) / 60000
                  )
                  return (
                    <Card
                      key={log.id}
                      className="p-4 cursor-pointer hover:bg-card/80 transition-colors active:scale-[0.98]"
                      onClick={() => navigate(`/history/${log.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{log.workoutName}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.completedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mr-1">
                            <Clock className="h-3.5 w-3.5" />
                            {duration} min
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={async (e) => {
                              e.stopPropagation()
                              if (await confirm({
                                title: 'Delete this workout log?',
                                confirmLabel: 'Delete',
                                destructive: true,
                              })) {
                                deleteLog.mutate(log.id)
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </section>
          ))}
      </div>
    </div>
  )
}
