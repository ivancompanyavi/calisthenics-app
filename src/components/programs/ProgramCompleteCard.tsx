import { useNavigate } from 'react-router-dom'
import { useActivateProgram } from '@/hooks/usePrograms'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, RotateCcw, Plus } from 'lucide-react'

interface ProgramCompleteCardProps {
  programId: string
  programName: string
  cyclesCompleted: number
  onDismiss: () => void
}

export function ProgramCompleteCard({
  programId,
  programName,
  cyclesCompleted,
  onDismiss,
}: ProgramCompleteCardProps) {
  const navigate = useNavigate()
  const activateProgram = useActivateProgram()

  const handleRestart = async () => {
    await activateProgram.mutateAsync(programId)
  }

  return (
    <Card className="border-green-500/30 bg-green-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-green-600">
          <Trophy className="h-5 w-5" />
          Program Complete!
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm font-medium">{programName}</p>
          <p className="text-xs text-muted-foreground">
            {cyclesCompleted} cycle{cyclesCompleted !== 1 ? 's' : ''} completed
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleRestart}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Restart
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/programs/new')}>
            <Plus className="h-4 w-4 mr-1" />
            New Program
          </Button>
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            Dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
