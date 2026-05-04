import { useNavigate } from 'react-router-dom'
import { useWorkouts } from '@/hooks/useWorkouts'
import { useWorkoutLogs } from '@/hooks/useHistory'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Play, Plus, Dumbbell, Clock, Download, Upload } from 'lucide-react'
import { db } from '@/db'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { InProgressWorkout } from '@/models/types'
import { exportAllData, importAllData, downloadJson } from '@/lib/data-transfer'
import { useRef } from 'react'

export function Home() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { data: workouts } = useWorkouts()
  const { data: recentLogs } = useWorkoutLogs()

  const { data: inProgress } = useQuery({
    queryKey: ['inProgressWorkout'],
    queryFn: async (): Promise<InProgressWorkout | undefined> => {
      const all = await db.inProgressWorkout.toArray()
      return all[0]
    },
  })

  const lastThreeLogs = recentLogs?.slice(0, 3)

  return (
    <div>
      <PageHeader title="Calisthenics" />

      <div className="px-4 space-y-6 pb-8">
        {inProgress && (
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
                <Button
                  size="sm"
                  onClick={() => navigate(`/execute/${inProgress.workoutId}`)}
                >
                  Resume
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await db.inProgressWorkout.clear()
                    window.location.reload()
                  }}
                >
                  Discard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Your Workouts</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/workouts')}
            >
              View All
            </Button>
          </div>

          {workouts?.length === 0 && (
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
            {workouts?.map((workout) => (
              <Card key={workout.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{workout.name}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/execute/${workout.id}`)}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Start
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {lastThreeLogs && lastThreeLogs.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Recent Activity</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/history')}
              >
                View All
              </Button>
            </div>
            <div className="space-y-2">
              {lastThreeLogs.map((log) => {
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
        )}
        <section>
          <h2 className="text-lg font-semibold mb-3">Data</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={async () => {
                const json = await exportAllData()
                const date = new Date().toISOString().split('T')[0]
                downloadJson(json, `calisthenics-backup-${date}.json`)
              }}
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-1" />
              Import
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                if (!confirm('This will replace all current data. Continue?')) return
                try {
                  const text = await file.text()
                  await importAllData(text)
                  queryClient.invalidateQueries()
                  alert('Data imported successfully!')
                } catch {
                  alert('Failed to import data. Invalid file format.')
                }
                e.target.value = ''
              }}
            />
          </div>
        </section>
      </div>
    </div>
  )
}
