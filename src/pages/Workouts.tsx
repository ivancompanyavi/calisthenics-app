import { useNavigate } from 'react-router-dom'
import { useWorkouts, useDeleteWorkout, checkWorkoutProgramUsage } from '@/hooks/useWorkouts'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, Pencil, Trash2, Play } from 'lucide-react'

export function Workouts() {
  const navigate = useNavigate()
  const { data: workouts, isLoading } = useWorkouts()
  const deleteWorkout = useDeleteWorkout()

  return (
    <div>
      <PageHeader title="Workouts">
        <Button size="sm" onClick={() => navigate('/workouts/new')}>
          <Plus className="h-4 w-4 mr-1" />
          New
        </Button>
      </PageHeader>

      <div className="px-4 space-y-3">
        {isLoading && (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        )}

        {!isLoading && workouts?.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No workouts yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create your first workout to get started.
            </p>
            <Button className="mt-4" onClick={() => navigate('/workouts/new')}>
              <Plus className="h-4 w-4 mr-1" />
              Create Workout
            </Button>
          </div>
        )}

        {workouts?.map((workout) => (
          <Card key={workout.id} className="p-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(`/workouts/${workout.id}`)}
                className="flex-1 min-w-0 text-left -my-2 py-2 -ml-2 pl-2 pr-2 rounded-md hover:bg-secondary/50 transition-colors touch-manipulation"
              >
                <p className="font-semibold truncate">{workout.name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(workout.createdAt).toLocaleDateString()}
                </p>
              </button>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => navigate(`/workouts/${workout.id}/edit`)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-destructive"
                  onClick={async () => {
                    const usedIn = await checkWorkoutProgramUsage(workout.id)
                    const warning = usedIn.length > 0
                      ? `\n\nWarning: This workout is used in: ${usedIn.join(', ')}`
                      : ''
                    if (confirm(`Delete "${workout.name}"?${warning}`)) {
                      deleteWorkout.mutate(workout.id)
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => navigate(`/execute/${workout.id}`)}
                >
                  <Play className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
