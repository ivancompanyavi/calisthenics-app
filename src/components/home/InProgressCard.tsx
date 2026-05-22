import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Dumbbell } from 'lucide-react'
import type { InProgressWorkout } from '@/models/types'

interface InProgressCardProps {
  inProgress: InProgressWorkout
  onDiscard: () => void
}

export function InProgressCard({ inProgress, onDiscard }: InProgressCardProps) {
  const navigate = useNavigate()
  const slotQs =
    inProgress.programDayIndex !== undefined
      ? `?slot=${inProgress.programDayIndex}`
      : ''

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-primary flex items-center gap-2">
          <Dumbbell className="h-5 w-5" />
          Workout in Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm mb-3">{inProgress.workoutName}</p>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => navigate(`/execute/${inProgress.workoutId}${slotQs}`)}>
            Resume
          </Button>
          <Button size="sm" variant="outline" onClick={onDiscard}>
            Discard
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
