import { useNavigate, useParams } from 'react-router-dom'
import {
  useProgram,
  useProgramDays,
  useActiveProgram,
  useCurrentSlot,
  useActivateProgram,
  useDeactivateProgram,
  useProgramHistory,
} from '@/hooks/usePrograms'
import { useWorkouts } from '@/hooks/useWorkouts'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Pencil, Play, Square, Moon, Dumbbell, AlertTriangle, Check, X as XIcon, ArrowRight } from 'lucide-react'

export function ProgramDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: program } = useProgram(id)
  const { data: days } = useProgramDays(id)
  const { data: workouts } = useWorkouts()
  const { data: activeProgram } = useActiveProgram()
  const { data: currentSlot } = useCurrentSlot()
  const { data: history } = useProgramHistory(id)
  const activateProgram = useActivateProgram()
  const deactivateProgram = useDeactivateProgram()

  const isActive = activeProgram?.programId === id
  const workoutMap = new Map(workouts?.map((w) => [w.id, w.name]) ?? [])
  const slots = isActive ? currentSlot?.cycleSlots : undefined
  const pointerIndex = isActive ? currentSlot?.pointerIndex ?? null : null

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
              {program.totalCycles > 0
                ? ` · ${program.totalCycles} cycles`
                : ' · Repeats indefinitely'}
            </p>
            {isActive && (
              <p className="text-xs text-primary font-medium mt-0.5">
                Currently active{currentSlot?.totalCycles
                  ? ` · Cycle ${currentSlot.currentCycle + 1}/${currentSlot.totalCycles}`
                  : currentSlot
                    ? ` · Cycle ${currentSlot.currentCycle + 1}`
                    : ''}
              </p>
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

        {isActive && slots && (
          <section>
            <h3 className="text-sm font-semibold mb-2">Current cycle progress</h3>
            <ul className="space-y-1.5">
              {slots.map((slot, index) => {
                const isPointer = index === pointerIndex
                const Icon = slot.workoutId ? Dumbbell : Moon
                const label = slot.workoutId
                  ? slot.workoutName ?? 'Removed workout'
                  : 'Rest day'

                return (
                  <li
                    key={index}
                    className={[
                      'flex items-center gap-3 rounded-lg border p-2.5 text-sm',
                      isPointer && 'border-primary bg-primary/10',
                      !isPointer && slot.status === 'pending' && 'border-border bg-card',
                      slot.status === 'done' && 'border-border bg-secondary/30 opacity-70',
                      slot.status === 'skipped' && 'border-border bg-secondary/30 opacity-50',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <span className="text-xs font-medium text-muted-foreground w-8 shrink-0">
                      D{slot.dayNumber}
                    </span>
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        isPointer ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    />
                    <span className="flex-1 font-medium truncate">{label}</span>
                    {slot.status === 'done' && (
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                    )}
                    {slot.status === 'skipped' && (
                      <XIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    {isPointer && slot.status === 'pending' && (
                      <ArrowRight className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        <section>
          <h3 className="text-sm font-semibold mb-2">Cycle schedule</h3>
          <div className="grid grid-cols-7 gap-1">
            {days?.map((day) => {
              const workoutName = day.workoutId ? workoutMap.get(day.workoutId) : undefined
              const isRemoved = day.workoutId && !workoutName

              return (
                <div
                  key={day.id}
                  className="rounded-lg p-1.5 text-center min-h-[60px] flex flex-col items-center justify-center bg-secondary/50"
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
            <h3 className="text-sm font-semibold mb-2">Past runs</h3>
            <div className="space-y-2">
              {history.map((run) => (
                <Card key={run.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm">
                        Started {new Date(run.startedAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {run.workoutsCompleted} workout
                        {run.workoutsCompleted !== 1 ? 's' : ''} completed
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        run.status === 'completed'
                          ? 'bg-green-500/20 text-green-600'
                          : 'bg-yellow-500/20 text-yellow-600'
                      }`}
                    >
                      {run.status === 'completed' ? 'Completed' : 'Stopped'}
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
