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
import { NotesSearchInput } from '@/components/history/NotesSearchInput'
import { searchNotes } from '@/lib/notes-search'
import { Clock, ChevronRight, Trash2, FileText } from 'lucide-react'

export function History() {
  const navigate = useNavigate()
  const { data: logs, isLoading } = useWorkoutLogs()
  // Loaded eagerly: the heatmap needs every set log to count daily volume, so
  // notes search reuses the same data rather than fetching it again.
  const { data: setLogs } = useAllSetLogs()
  const deleteLog = useDeleteWorkoutLog()
  const confirm = useConfirm()

  // Heatmap tap-to-filter state: null means "show all".
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const heatmapGrid = useMemo(
    () => buildHeatmapGrid(logs ?? [], setLogs ?? []),
    [logs, setLogs],
  )

  const isSearching = searchTerm.trim().length > 0

  const searchMatches = useMemo(() => {
    if (!isSearching || !logs) return null
    return searchNotes(logs, setLogs ?? [], searchTerm)
  }, [isSearching, logs, setLogs, searchTerm])

  // Fast lookup logId → NoteMatch for rendering snippets on matched cards.
  const matchMap = useMemo(
    () => new Map(searchMatches?.map((m) => [m.workoutLogId, m]) ?? []),
    [searchMatches],
  )

  // Apply the heatmap date filter and the notes search together (AND).
  const filteredLogs = useMemo(() => {
    if (!logs) return []
    let result = logs
    if (selectedDate) {
      result = result.filter((l) => toLocalDateKey(l.completedAt) === selectedDate)
    }
    if (isSearching && searchMatches) {
      const ids = new Set(searchMatches.map((m) => m.workoutLogId))
      result = result.filter((l) => ids.has(l.id))
    }
    return result
  }, [logs, selectedDate, isSearching, searchMatches])

  const groupedByDate = useMemo(
    () =>
      filteredLogs.reduce<Record<string, typeof filteredLogs>>((acc, log) => {
        const date = new Date(log.completedAt).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
        if (!acc[date]) acc[date] = []
        acc[date].push(log)
        return acc
      }, {}),
    [filteredLogs],
  )

  const hasAnyLogs = !!logs && logs.length > 0
  const hasResults = filteredLogs.length > 0

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

        <NotesSearchInput value={searchTerm} onChange={setSearchTerm} />

        {isLoading && (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        )}

        {/* Empty state: no logs at all */}
        {!isLoading && !hasAnyLogs && (
          <div className="py-12 text-center">
            <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No workouts completed yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Complete a workout to see it here.
            </p>
          </div>
        )}

        {/* Empty state: search has no matches */}
        {!isLoading && hasAnyLogs && isSearching && !hasResults && (
          <div className="py-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No notes match &ldquo;{searchTerm}&rdquo;.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try a different search term.
            </p>
          </div>
        )}

        {/* Empty state: a date is selected (and not searching) with no workouts */}
        {!isLoading && hasAnyLogs && !isSearching && selectedDate && !hasResults && (
          <div className="py-8 text-center text-muted-foreground text-sm">
            No workouts logged on this day.
          </div>
        )}

        {/* Result count hint when searching */}
        {isSearching && hasResults && (
          <p className="text-xs text-muted-foreground">
            {filteredLogs.length} workout{filteredLogs.length !== 1 ? 's' : ''} matched
          </p>
        )}

        {hasResults &&
          Object.entries(groupedByDate).map(([date, dateLogs]) => (
            <section key={date}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">{date}</h3>
              <div className="space-y-2">
                {dateLogs.map((log) => {
                  const duration = Math.round(
                    (log.completedAt - log.startedAt) / 60000,
                  )
                  const match = matchMap.get(log.id)

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
                              if (
                                await confirm({
                                  title: 'Delete this workout log?',
                                  confirmLabel: 'Delete',
                                  destructive: true,
                                })
                              ) {
                                deleteLog.mutate(log.id)
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>

                      {/* Note snippets — only visible when a search is active */}
                      {match && (
                        <div className="mt-2 space-y-1 border-t border-border/40 pt-2">
                          {match.workoutNoteMatched && log.notes && (
                            <p className="text-xs italic text-muted-foreground line-clamp-2">
                              {log.notes}
                            </p>
                          )}
                          {match.matchedSets.map((s, i) => (
                            <p
                              key={i}
                              className="text-xs text-muted-foreground line-clamp-1"
                            >
                              <span className="font-medium text-foreground/70">
                                {s.movementName}:
                              </span>{' '}
                              {s.notes}
                            </p>
                          ))}
                        </div>
                      )}
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
