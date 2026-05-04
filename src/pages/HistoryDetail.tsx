import { useParams, useNavigate } from 'react-router-dom'
import { useWorkoutLog, useSetLogs, useDeleteWorkoutLog } from '@/hooks/useHistory'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Clock, Target, Check, Trash2 } from 'lucide-react'

export function HistoryDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: log } = useWorkoutLog(id)
  const { data: sets } = useSetLogs(id)
  const deleteLog = useDeleteWorkoutLog()

  if (!log) {
    return (
      <div>
        <PageHeader title="Workout Detail" />
        <div className="px-4 py-8 text-center text-muted-foreground">Loading...</div>
      </div>
    )
  }

  const duration = Math.round((log.completedAt - log.startedAt) / 60000)

  return (
    <div>
      <PageHeader title={log.workoutName}>
        <Button variant="ghost" size="icon" onClick={() => navigate('/history')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </PageHeader>

      <div className="px-4 space-y-4 pb-8">
        <div className="flex gap-4">
          <Card className="flex-1 p-4 text-center">
            <Clock className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
            <p className="text-2xl font-bold">{duration}</p>
            <p className="text-xs text-muted-foreground">minutes</p>
          </Card>
          <Card className="flex-1 p-4 text-center">
            <Target className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
            <p className="text-2xl font-bold">{sets?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground">sets</p>
          </Card>
        </div>

        <div className="text-sm text-muted-foreground">
          {new Date(log.completedAt).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}{' '}
          at{' '}
          {new Date(log.completedAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>

        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={() => {
            if (confirm('Delete this workout log?')) {
              deleteLog.mutate(log.id)
              navigate('/history')
            }
          }}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete Workout Log
        </Button>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Sets
          </h3>
          {sets?.map((set, i) => {
            const isReps = set.targetReps !== undefined
            const hitTarget = isReps
              ? (set.actualReps ?? 0) >= (set.targetReps ?? 0)
              : (set.actualSeconds ?? 0) >= (set.targetSeconds ?? 0)

            return (
              <Card key={set.id} className="p-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted-foreground w-6 text-center">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{set.movementName}</p>
                    {set.round > 0 && (
                      <p className="text-xs text-muted-foreground">Round {set.round + 1}</p>
                    )}
                  </div>
                  <div className="text-right">
                    {isReps ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {set.actualReps}/{set.targetReps} reps
                        </span>
                        {hitTarget && <Check className="h-4 w-4 text-primary" />}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {set.actualSeconds}/{set.targetSeconds}s
                        </span>
                        {hitTarget && <Check className="h-4 w-4 text-primary" />}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
