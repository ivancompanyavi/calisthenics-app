import { useNavigate, useParams } from 'react-router-dom'
import { useProgram, useProgramDays, useActiveProgram, useActivateProgram, useDeactivateProgram, useProgramHistory } from '@/hooks/usePrograms'
import { useWorkouts } from '@/hooks/useWorkouts'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Pencil, Play, Square, Moon, Dumbbell, AlertTriangle } from 'lucide-react'

export function ProgramDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: program } = useProgram(id)
  const { data: days } = useProgramDays(id)
  const { data: workouts } = useWorkouts()
  const { data: activeProgram } = useActiveProgram()
  const { data: history } = useProgramHistory(id)
  const activateProgram = useActivateProgram()
  const deactivateProgram = useDeactivateProgram()

  const isActive = activeProgram?.programId === id
  const workoutMap = new Map(workouts?.map((w) => [w.id, w.name]) ?? [])

  const todayDayNumber = (() => {
    if (!isActive || !activeProgram || !program) return undefined
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const daysSinceStart = Math.floor((now.getTime() - activeProgram.startedAt) / (1000 * 60 * 60 * 24))
    return (daysSinceStart % program.cycleLengthDays) + 1
  })()

  if (!program) {
    return (
      <div>
        <PageHeader title="Program">
          <Button variant="ghost" size="sm" onClick={() => navigate('/programs')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </PageHeader>
        <div className="px-4 py-8 text-center text-muted-foreground">Loading...</div>
      </div>
    )
  }

  const rows: Array<typeof days> = []
  if (days) {
    for (let i = 0; i < days.length; i += 7) {
      rows.push(days.slice(i, i + 7))
    }
  }

  return (
    <div>
      <PageHeader title={program.name}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/programs')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </PageHeader>

      <div className="px-4 space-y-4 pb-24">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {program.cycleLengthDays} days per cycle
              {program.totalCycles > 0 ? ` \u00b7 ${program.totalCycles} cycles` : ' \u00b7 Repeats indefinitely'}
            </p>
            {isActive && (
              <p className="text-xs text-primary font-medium mt-0.5">Currently active</p>
            )}
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/programs/${id}/edit`)}
            >
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
            {isActive ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm('Stop this program?')) {
                    deactivateProgram.mutate(activeProgram!.id)
                  }
                }}
              >
                <Square className="h-4 w-4 mr-1" />
                Stop
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => activateProgram.mutate(program.id)}
              >
                <Play className="h-4 w-4 mr-1" />
                Start
              </Button>
            )}
          </div>
        </div>

        <section>
          <h3 className="text-sm font-semibold mb-2">Cycle Schedule</h3>
          <div className="grid grid-cols-7 gap-1">
            {days?.map((day) => {
              const workoutName = day.workoutId ? workoutMap.get(day.workoutId) : undefined
              const isToday = todayDayNumber === day.dayNumber
              const isRemoved = day.workoutId && !workoutName

              return (
                <div
                  key={day.id}
                  className={`rounded-lg p-1.5 text-center min-h-[60px] flex flex-col items-center justify-center ${
                    isToday
                      ? 'ring-2 ring-primary bg-primary/10'
                      : 'bg-secondary/50'
                  }`}
                >
                  <span className="text-[10px] font-medium text-muted-foreground">
                    D{day.dayNumber}
                  </span>
                  {isRemoved ? (
                    <AlertTriangle className="h-3 w-3 text-destructive mt-0.5" />
                  ) : day.workoutId ? (
                    <>
                      <Dumbbell className="h-3 w-3 text-primary mt-0.5" />
                      <span className="text-[9px] text-foreground truncate w-full mt-0.5 leading-tight">
                        {workoutName}
                      </span>
                    </>
                  ) : (
                    <Moon className="h-3 w-3 text-muted-foreground mt-0.5" />
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {history && history.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold mb-2">History</h3>
            <div className="space-y-2">
              {history.map((run) => (
                <Card key={run.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm">
                        {new Date(run.startedAt).toLocaleDateString()} — {run.endLabel}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {run.workoutsCompleted} workout{run.workoutsCompleted !== 1 ? 's' : ''} completed
                      </p>
                    </div>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                      run.status === 'completed'
                        ? 'bg-green-500/20 text-green-600'
                        : 'bg-yellow-500/20 text-yellow-600'
                    }`}>
                      {run.status === 'completed' ? 'Completed' : 'Abandoned'}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
