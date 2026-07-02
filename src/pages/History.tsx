import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkoutLogs, useDeleteWorkoutLog, useAllSetLogs } from '@/hooks/useHistory'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useConfirm } from '@/components/ui/confirm-context'
import { InsightsPanel } from '@/components/history/InsightsPanel'
import { NotesSearchInput } from '@/components/history/NotesSearchInput'
import { searchNotes } from '@/lib/notes-search'
import { Clock, ChevronRight, Trash2, FileText } from 'lucide-react'

export function History() {
  const navigate = useNavigate()
  const { data: logs, isLoading } = useWorkoutLogs()
  const deleteLog = useDeleteWorkoutLog()
  const confirm = useConfirm()

  const [searchTerm, setSearchTerm] = useState('')

  // Only fetch all set logs when the user is actually searching — avoids an
  // unnecessary full-table scan on every History page visit.
  const isSearching = searchTerm.trim().length > 0
  const { data: allSetLogs } = useAllSetLogs(isSearching)

  // Compute which logs match and collect the snippet details.
  const searchMatches = useMemo(() => {
    if (!isSearching || !logs) return null
    return searchNotes(logs, allSetLogs ?? [], searchTerm)
  }, [isSearching, logs, allSetLogs, searchTerm])

  // Build a fast lookup: logId → NoteMatch (for snippet rendering).
  const matchMap = useMemo(
    () => new Map(searchMatches?.map((m) => [m.workoutLogId, m]) ?? []),
    [searchMatches],
  )

  // When searching, show only matched logs; otherwise show everything.
  const displayedLogs = useMemo(() => {
    if (!logs) return []
    if (!isSearching || !searchMatches) return logs
    const matchedIds = new Set(searchMatches.map((m) => m.workoutLogId))
    return logs.filter((l) => matchedIds.has(l.id))
  }, [logs, isSearching, searchMatches])

  const groupedByDate = displayedLogs.reduce<Record<string, typeof displayedLogs>>(
    (acc, log) => {
      const date = new Date(log.completedAt).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      if (!acc[date]) acc[date] = []
      acc[date].push(log)
      return acc
    },
    {},
  )

  const hasResults = displayedLogs.length > 0

  return (
    <div>
      <PageHeader title="History" />

      <div className="px-4 space-y-6 pb-8">
        <InsightsPanel />

        <NotesSearchInput value={searchTerm} onChange={setSearchTerm} />

        {isLoading && (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        )}

        {/* Empty state: no logs at all */}
        {!isLoading && (!logs || logs.length === 0) && (
          <div className="py-12 text-center">
            <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No workouts completed yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Complete a workout to see it here.
            </p>
          </div>
        )}

        {/* Empty state: search has no matches */}
        {!isLoading && logs && logs.length > 0 && isSearching && !hasResults && (
          <div className="py-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No notes match &ldquo;{searchTerm}&rdquo;.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try a different search term.
            </p>
          </div>
        )}

        {/* Result count hint when searching */}
        {isSearching && hasResults && (
          <p className="text-xs text-muted-foreground">
            {displayedLogs.length} workout{displayedLogs.length !== 1 ? 's' : ''} matched
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
