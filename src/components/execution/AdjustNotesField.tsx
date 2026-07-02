import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { StickyNote } from 'lucide-react'

interface AdjustNotesFieldProps {
  notes: string
  onChange: (v: string) => void
}

// Collapsible notes input for the adjust screen. Collapses to a small "Add note"
// link when empty; expands to a textarea on tap. Pre-expands if notes non-empty.
export function AdjustNotesField({ notes, onChange }: AdjustNotesFieldProps) {
  const [showNotes, setShowNotes] = useState(!!notes)

  return (
    <div className="w-full max-w-xs">
      {showNotes ? (
        <Textarea
          value={notes}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Note for this set..."
          className="h-16 resize-none"
        />
      ) : (
        <button
          type="button"
          className="text-xs text-muted-foreground flex items-center gap-1 mx-auto"
          onClick={() => setShowNotes(true)}
        >
          <StickyNote className="h-3 w-3" />
          Add note
        </button>
      )}
    </div>
  )
}
