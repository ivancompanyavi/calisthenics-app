import { useState } from 'react'
import type { DraftBlock, DraftEntry } from '@/models/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { ProgressionPicker } from './ProgressionPicker'
import { EntryRow } from './EntryRow'
import { ChevronUp, ChevronDown, Trash2, Plus } from 'lucide-react'
import { generateId } from '@/lib/utils'

interface BlockEditorProps {
  block: DraftBlock
  index: number
  totalBlocks: number
  onUpdate: (updates: Partial<DraftBlock>) => void
  onRemove: () => void
  onMove: (direction: 'up' | 'down') => void
}

export function BlockEditor({ block, index, totalBlocks, onUpdate, onRemove, onMove }: BlockEditorProps) {
  const [showPicker, setShowPicker] = useState(false)

  const addEntry = (progressionId: string) => {
    const entry: DraftEntry = {
      id: generateId(),
      progressionId,
    }
    onUpdate({ entries: [...block.entries, entry] })
    setShowPicker(false)
  }

  const updateEntry = (entryId: string, updates: Partial<DraftEntry>) => {
    onUpdate({
      entries: block.entries.map((e) =>
        e.id === entryId ? { ...e, ...updates } : e
      ),
    })
  }

  const removeEntry = (entryId: string) => {
    onUpdate({ entries: block.entries.filter((e) => e.id !== entryId) })
  }

  const moveEntry = (entryIndex: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? entryIndex - 1 : entryIndex + 1
    if (newIndex < 0 || newIndex >= block.entries.length) return
    const newEntries = [...block.entries]
    ;[newEntries[entryIndex], newEntries[newIndex]] = [newEntries[newIndex], newEntries[entryIndex]]
    onUpdate({ entries: newEntries })
  }

  return (
    <Card className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded">
            {index + 1}
          </span>
          <span className="text-sm font-semibold uppercase tracking-wider">
            {block.type === 'superset' ? 'Superset' : 'Set'}
          </span>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={index === 0}
            onClick={() => onMove('up')}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={index === totalBlocks - 1}
            onClick={() => onMove('down')}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {block.entries.map((entry, i) => (
          <EntryRow
            key={entry.id}
            entry={entry}
            index={i}
            totalEntries={block.entries.length}
            onUpdate={(updates) => updateEntry(entry.id, updates)}
            onRemove={() => removeEntry(entry.id)}
            onMove={(dir) => moveEntry(i, dir)}
          />
        ))}
      </div>

      {(block.type === 'superset' || block.entries.length === 0) && (
        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={() => setShowPicker(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Exercise
        </Button>
      )}

      <div className="flex gap-3 pt-1">
        <div className="flex-1 space-y-1">
          <label className="text-xs text-muted-foreground">Rounds</label>
          <Input
            type="number"
            min={1}
            max={20}
            value={block.rounds}
            onChange={(e) => onUpdate({ rounds: Math.max(1, parseInt(e.target.value) || 1) })}
            className="h-9"
          />
        </div>
        <div className="flex-1 space-y-1">
          <label className="text-xs text-muted-foreground">Rest (sec)</label>
          <Input
            type="number"
            min={0}
            step={15}
            value={block.restSeconds}
            onChange={(e) => onUpdate({ restSeconds: Math.max(0, parseInt(e.target.value) || 0) })}
            className="h-9"
          />
        </div>
      </div>

      <Dialog open={showPicker} onClose={() => setShowPicker(false)}>
        <ProgressionPicker onSelect={addEntry} />
      </Dialog>
    </Card>
  )
}
