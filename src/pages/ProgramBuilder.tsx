import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProgram, useProgramDays, useCreateProgram, useUpdateProgram } from '@/hooks/usePrograms'
import { useWorkouts } from '@/hooks/useWorkouts'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { DialogTitle } from '@/components/ui/dialog'
import { Save, ArrowLeft, X, ChevronUp, ChevronDown, Moon, Dumbbell, AlertTriangle } from 'lucide-react'

interface DraftDay {
  id: string
  workoutId?: string
}

export function ProgramBuilder() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditing = !!id

  const { data: existingProgram } = useProgram(id)
  const { data: existingDays } = useProgramDays(id)
  const { data: workouts } = useWorkouts()
  const createProgram = useCreateProgram()
  const updateProgram = useUpdateProgram()

  const [name, setName] = useState('')
  const [totalCycles, setTotalCycles] = useState(4)
  const [infinite, setInfinite] = useState(false)
  const [days, setDays] = useState<DraftDay[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (isEditing && existingProgram && existingDays && !loaded) {
      setName(existingProgram.name)
      setTotalCycles(existingProgram.totalCycles || 4)
      setInfinite(existingProgram.totalCycles === 0)
      setDays(existingDays.map((d) => ({
        id: d.id,
        workoutId: d.workoutId,
      })))
      setLoaded(true)
    }
  }, [isEditing, existingProgram, existingDays, loaded])

  const addRestDay = () => {
    setDays((prev) => [...prev, { id: crypto.randomUUID(), workoutId: undefined }])
  }

  const addWorkoutDay = (workoutId: string) => {
    setDays((prev) => [...prev, { id: crypto.randomUUID(), workoutId }])
    setShowPicker(false)
  }

  const removeDay = (index: number) => {
    setDays((prev) => prev.filter((_, i) => i !== index))
  }

  const moveDay = (index: number, direction: 'up' | 'down') => {
    setDays((prev) => {
      const next = [...prev]
      const target = direction === 'up' ? index - 1 : index + 1
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const handleSave = async () => {
    if (!name.trim() || days.length === 0) return

    const data = {
      name: name.trim(),
      totalCycles: infinite ? 0 : totalCycles,
      days: days.map((d) => ({ workoutId: d.workoutId })),
    }

    if (isEditing) {
      await updateProgram.mutateAsync({ ...data, id: id! })
    } else {
      await createProgram.mutateAsync(data)
    }
    navigate('/programs')
  }

  const getWorkoutName = (workoutId?: string) => {
    if (!workoutId) return null
    return workouts?.find((w) => w.id === workoutId)?.name ?? 'Unknown workout'
  }

  return (
    <div>
      <PageHeader title={isEditing ? 'Edit Program' : 'New Program'}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/programs')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </PageHeader>

      <div className="px-4 space-y-4 pb-24">
        <div className="space-y-2">
          <label className="text-sm font-medium">Program Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Calisthenics Fundamentals"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Cycles</label>
          <div className="flex items-center gap-3">
            {!infinite && (
              <Input
                type="number"
                min={1}
                value={totalCycles}
                onChange={(e) => setTotalCycles(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20"
              />
            )}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={infinite}
                onChange={(e) => setInfinite(e.target.checked)}
                className="rounded"
              />
              Repeat indefinitely
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Schedule ({days.length} day{days.length !== 1 ? 's' : ''} per cycle)
          </label>

          <div className="space-y-2">
            {days.map((day, index) => (
              <Card key={day.id} className="p-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground w-10">
                    Day {index + 1}
                  </span>
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    {day.workoutId ? (
                      getWorkoutName(day.workoutId) === 'Unknown workout' ? (
                        <>
                          <AlertTriangle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
                          <span className="text-sm font-medium text-destructive truncate">
                            Workout removed
                          </span>
                        </>
                      ) : (
                        <>
                          <Dumbbell className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                          <span className="text-sm font-medium truncate">
                            {getWorkoutName(day.workoutId)}
                          </span>
                        </>
                      )
                    ) : (
                      <>
                        <Moon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">Rest Day</span>
                      </>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-5"
                      disabled={index === 0}
                      onClick={() => moveDay(index, 'up')}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-5"
                      disabled={index === days.length - 1}
                      onClick={() => moveDay(index, 'down')}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 flex-shrink-0"
                    onClick={() => removeDay(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPicker(true)}
              className="flex-1"
            >
              <Dumbbell className="h-4 w-4 mr-1" />
              Add Workout Day
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={addRestDay}
              className="flex-1"
            >
              <Moon className="h-4 w-4 mr-1" />
              Add Rest Day
            </Button>
          </div>
        </div>

        <Button
          className="w-full"
          onClick={handleSave}
          disabled={!name.trim() || days.length === 0}
        >
          <Save className="h-4 w-4 mr-1" />
          {isEditing ? 'Update Program' : 'Create Program'}
        </Button>
      </div>

      <Dialog open={showPicker} onClose={() => setShowPicker(false)}>
        <WorkoutPicker workouts={workouts ?? []} onSelect={addWorkoutDay} />
      </Dialog>
    </div>
  )
}

function WorkoutPicker({ workouts, onSelect }: {
  workouts: Array<{ id: string; name: string }>
  onSelect: (workoutId: string) => void
}) {
  const [search, setSearch] = useState('')

  const filtered = workouts.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-3">
      <DialogTitle>Select Workout</DialogTitle>
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search workouts..."
        autoFocus
      />
      <div className="max-h-64 overflow-y-auto -mx-2">
        {filtered.map((w) => (
          <button
            key={w.id}
            onClick={() => onSelect(w.id)}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors touch-manipulation text-left"
          >
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{w.name}</span>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No workouts found. Create workouts first.
          </p>
        )}
      </div>
    </div>
  )
}
