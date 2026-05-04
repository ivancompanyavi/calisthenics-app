import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { MovementsList } from '@/components/movements/MovementsList'
import { ProgressionsList } from '@/components/progressions/ProgressionsList'

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
          </TabsList>
          <TabsContent value="movements">
            <MovementsList />
          </TabsContent>
          <TabsContent value="progressions">
            <ProgressionsList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
