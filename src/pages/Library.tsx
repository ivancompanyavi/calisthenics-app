import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { MovementsList } from '@/components/movements/MovementsList'
import { ProgressionsList } from '@/components/progressions/ProgressionsList'
import { WorkoutManager } from '@/components/workouts/WorkoutManager'
import { ProgramManager } from '@/components/programs/ProgramManager'

// The library / authoring hub: movements, progressions, workouts, and programs
// all live here as sub-tabs, so the bottom nav doesn't carry a separate tab for
// each rarely-touched authoring surface.
export function LibraryPage() {
  const [tab, setTab] = useState('movements')

  return (
    <div>
      <PageHeader title="Library" />
      <div className="px-4">
        <Tabs value={tab} onChange={setTab}>
          <TabsList>
            <TabsTrigger value="movements">Movements</TabsTrigger>
            <TabsTrigger value="progressions">Progressions</TabsTrigger>
            <TabsTrigger value="workouts">Workouts</TabsTrigger>
            <TabsTrigger value="programs">Programs</TabsTrigger>
          </TabsList>
          <TabsContent value="movements">
            <MovementsList />
          </TabsContent>
          <TabsContent value="progressions">
            <ProgressionsList />
          </TabsContent>
          <TabsContent value="workouts">
            <WorkoutManager />
          </TabsContent>
          <TabsContent value="programs">
            <ProgramManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
