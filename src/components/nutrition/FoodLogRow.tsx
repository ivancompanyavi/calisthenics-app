import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Pencil, Trash2 } from 'lucide-react'
import type { FoodLog } from '@/models/types'

export function FoodLogRow({
  log,
  onEdit,
  onDelete,
}: {
  log: FoodLog
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{log.name}</p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {Math.round(log.kcal)} kcal · P{Math.round(log.proteinG)} · C{Math.round(log.carbG)} · F
            {Math.round(log.fatG)}
            {log.quantityG != null ? ` · ${log.quantityG}g` : ''}
            {log.servings != null ? ` · ${log.servings}x` : ''}
          </p>
          {log.notes && <p className="text-xs italic text-muted-foreground mt-0.5">{log.notes}</p>}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={onEdit}
          aria-label="Edit entry"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          aria-label="Delete entry"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}
