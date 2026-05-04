import { Button } from '@/components/ui/button'
import { Trophy } from 'lucide-react'

interface CompleteScreenProps {
  workoutName: string
  startedAt: number
  setsCompleted: number
  onFinish: () => void
}

export function CompleteScreen({ workoutName, startedAt, setsCompleted, onFinish }: CompleteScreenProps) {
  const duration = Math.round((Date.now() - startedAt) / 60000)

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
      <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center">
        <Trophy className="h-10 w-10 text-primary" />
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold">Workout Complete!</h2>
        <p className="text-muted-foreground mt-1">{workoutName}</p>
      </div>

      <div className="flex gap-8">
        <div className="text-center">
          <p className="text-3xl font-bold">{duration}</p>
          <p className="text-xs text-muted-foreground">minutes</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold">{setsCompleted}</p>
          <p className="text-xs text-muted-foreground">sets</p>
        </div>
      </div>

      <Button size="lg" className="text-lg px-12 mt-4" onClick={onFinish}>
        Save & Finish
      </Button>
    </div>
  )
}
