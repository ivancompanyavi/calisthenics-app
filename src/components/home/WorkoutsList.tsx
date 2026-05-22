import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dumbbell, Play, Plus } from 'lucide-react'
import type { Workout } from '@/models/types'

interface WorkoutsListProps {
  workouts: Workout[]
}

export function WorkoutsList({ workouts }: WorkoutsListProps) {
  const navigate = useNavigate()

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Your Workouts</h2>
        <Button variant="ghost" size="sm" onClick={() => navigate('/workouts')}>
          View All
        </Button>
      </div>

      {workouts.length === 0 && (
        <Card className="p-6 text-center">
          <Dumbbell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No workouts yet</p>
          <Button className="mt-3" size="sm" onClick={() => navigate('/workouts/new')}>
            <Plus className="h-4 w-4 mr-1" />
            Create Workout
          </Button>
        </Card>
      )}

      <div className="space-y-2">
        {workouts.map((workout) => (
          <Card key={workout.id} className="p-4">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => navigate(`/workouts/${workout.id}`)}
                className="flex-1 min-w-0 text-left -my-2 py-2 -ml-2 pl-2 pr-2 rounded-md hover:bg-secondary/50 transition-colors touch-manipulation"
              >
                <p className="font-semibold truncate">{workout.name}</p>
              </button>
              <Button size="sm" onClick={() => navigate(`/execute/${workout.id}`)}>
                <Play className="h-4 w-4 mr-1" />
                Start
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}
