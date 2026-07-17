import { PageHeader } from '@/components/ui/page-header'
import { WorkoutManager } from '@/components/workouts/WorkoutManager'

export function Workouts() {
  return (
    <div>
      <PageHeader title="Workouts" />
      <div className="px-4">
        <WorkoutManager />
      </div>
    </div>
  )
}
