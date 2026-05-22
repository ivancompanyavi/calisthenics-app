import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Clock } from 'lucide-react'
import type { WorkoutLog } from '@/models/types'

interface RecentActivityListProps {
  logs: WorkoutLog[]
}

export function RecentActivityList({ logs }: RecentActivityListProps) {
  const navigate = useNavigate()

  if (logs.length === 0) return null

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <Button variant="ghost" size="sm" onClick={() => navigate('/history')}>
          View All
        </Button>
      </div>
      <div className="space-y-2">
        {logs.map((log) => {
          const duration = Math.round((log.completedAt - log.startedAt) / 60000)
          return (
            <Card
              key={log.id}
              className="p-3 cursor-pointer hover:bg-card/80 transition-colors"
              onClick={() => navigate(`/history/${log.id}`)}
            >
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">{log.workoutName}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(log.completedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {duration} min
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
