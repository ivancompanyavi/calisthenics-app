import { PageHeader } from '@/components/ui/page-header'
import { ProgramManager } from '@/components/programs/ProgramManager'

export function Programs() {
  return (
    <div>
      <PageHeader title="Programs" />
      <div className="px-4">
        <ProgramManager />
      </div>
    </div>
  )
}
