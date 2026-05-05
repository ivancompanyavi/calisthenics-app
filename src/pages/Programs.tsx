import { useNavigate } from 'react-router-dom'
import { usePrograms, useDeleteProgram, useActiveProgram, useActivateProgram, useDeactivateProgram } from '@/hooks/usePrograms'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, Pencil, Trash2, Play, Square, ChevronRight } from 'lucide-react'

export function Programs() {
  const navigate = useNavigate()
  const { data: programs, isLoading } = usePrograms()
  const { data: activeProgram } = useActiveProgram()
  const deleteProgram = useDeleteProgram()
  const activateProgram = useActivateProgram()
  const deactivateProgram = useDeactivateProgram()

  const isActive = (programId: string) => activeProgram?.programId === programId

  return (
    <div>
      <PageHeader title="Programs">
        <Button size="sm" onClick={() => navigate('/programs/new')}>
          <Plus className="h-4 w-4 mr-1" />
          New
        </Button>
      </PageHeader>

      <div className="px-4 space-y-3">
        {isLoading && (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        )}

        {!isLoading && programs?.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No programs yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create a program to schedule your workouts across the week.
            </p>
            <Button className="mt-4" onClick={() => navigate('/programs/new')}>
              <Plus className="h-4 w-4 mr-1" />
              Create Program
            </Button>
          </div>
        )}

        {programs?.map((program) => (
          <Card key={program.id} className={`p-4 ${isActive(program.id) ? 'ring-2 ring-primary' : ''}`}>
            <div className="flex items-center gap-3">
              <button
                className="flex-1 min-w-0 text-left touch-manipulation"
                onClick={() => navigate(`/programs/${program.id}`)}
              >
                <div className="flex items-center gap-2">
                  <p className="font-semibold truncate">{program.name}</p>
                  {isActive(program.id) && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {program.cycleLengthDays} days/cycle
                  {program.totalCycles > 0 ? ` \u00b7 ${program.totalCycles} cycles` : ' \u00b7 Repeats'}
                  {program.completedCount > 0 && ` \u00b7 Completed ${program.completedCount}x`}
                </p>
              </button>
              <div className="flex gap-1 items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => navigate(`/programs/${program.id}/edit`)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-destructive"
                  onClick={() => {
                    if (confirm(`Delete "${program.name}"?`)) {
                      deleteProgram.mutate(program.id)
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                {isActive(program.id) ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => {
                      if (confirm('Stop this program?')) {
                        deactivateProgram.mutate(activeProgram!.id)
                      }
                    }}
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => activateProgram.mutate(program.id)}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                )}
                <ChevronRight
                  className="h-4 w-4 text-muted-foreground cursor-pointer"
                  onClick={() => navigate(`/programs/${program.id}`)}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
