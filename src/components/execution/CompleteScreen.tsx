import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Trophy, TrendingUp } from 'lucide-react'
import type { LevelUpCandidate, Progression } from '@/models/types'
import type { ReadinessVerdict } from '@/lib/readiness-engine'
import { AdvanceSuggestionCard } from '@/components/progressions/AdvanceSuggestionCard'

interface ReadyVerdict {
  progression: Progression
  verdict: ReadinessVerdict
}

interface CompleteScreenProps {
  workoutName: string
  startedAt: number
  setsCompleted: number
  notes: string
  onSetNotes: (v: string) => void
  levelUpCandidates: LevelUpCandidate[]
  onLevelUp: (progressionId: string) => void
  /** Save the workout log. Called when user clicks "Save". */
  onSave: () => void
  /** Navigate home. Called when user clicks "Done" (after save). */
  onFinish: () => void
  /** True while the save mutation is in-flight. */
  isSaving: boolean
  /** True once the workout has been saved successfully. */
  saved: boolean
  /**
   * Progressions trained in this session that are now ready-to-advance
   * (after the session was saved). Shown below the summary once `saved` is true.
   */
  readyVerdicts: ReadyVerdict[]
}

export function CompleteScreen({
  workoutName,
  startedAt,
  setsCompleted,
  notes,
  onSetNotes,
  levelUpCandidates,
  onLevelUp,
  onSave,
  onFinish,
  isSaving,
  saved,
  readyVerdicts,
}: CompleteScreenProps) {
  // Snapshot duration at first render — the workout has already ended by the
  // time this screen mounts, so a stable value here matches the displayed UI.
  const [duration] = useState(() => Math.round((Date.now() - startedAt) / 60000))
  const [leveledUp, setLeveledUp] = useState<Set<string>>(new Set())

  const handleLevelUp = (progressionId: string) => {
    onLevelUp(progressionId)
    setLeveledUp((prev) => new Set(prev).add(progressionId))
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6 py-8">
      <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center">
        <Trophy className="h-10 w-10 text-primary" />
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold">Workout Complete!</h2>
        <p className="text-muted-foreground mt-1">{workoutName}</p>
      </div>

      <div className="flex gap-8">
        <div className="text-center">
          <p className="text-3xl font-bold">{duration}</p>
          <p className="text-xs text-muted-foreground">minutes</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold">{setsCompleted}</p>
          <p className="text-xs text-muted-foreground">sets</p>
        </div>
      </div>

      {levelUpCandidates.length > 0 && (
        <div className="w-full max-w-sm space-y-2">
          <p className="text-sm font-medium text-center flex items-center justify-center gap-1">
            <TrendingUp className="h-4 w-4 text-green-500" />
            Ready to level up!
          </p>
          {levelUpCandidates.map((c) => (
            <div key={c.progressionId} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <div>
                <p className="text-sm font-medium">{c.progressionName}</p>
                <p className="text-xs text-muted-foreground">Next: {c.nextMovementName}</p>
              </div>
              <Button
                size="sm"
                variant={leveledUp.has(c.progressionId) ? 'secondary' : 'default'}
                disabled={leveledUp.has(c.progressionId)}
                onClick={() => handleLevelUp(c.progressionId)}
              >
                {leveledUp.has(c.progressionId) ? 'Done!' : 'Level Up'}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Notes field — editable before save; read-only hint after */}
      <div className="w-full max-w-sm">
        <Textarea
          value={notes}
          onChange={(e) => onSetNotes(e.target.value)}
          placeholder="How did the workout feel? Any notes..."
          className="h-20 resize-none"
          disabled={saved}
        />
      </div>

      {/* Post-save readiness cards for progressions trained in this session */}
      {saved && readyVerdicts.length > 0 && (
        <div className="w-full max-w-sm space-y-2">
          {readyVerdicts.map(({ progression, verdict }) => (
            <AdvanceSuggestionCard
              key={progression.id}
              progression={progression}
              verdict={verdict}
            />
          ))}
        </div>
      )}

      {!saved ? (
        <Button
          size="lg"
          className="text-lg px-12 mt-2"
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving…' : 'Save & Finish'}
        </Button>
      ) : (
        <Button size="lg" className="text-lg px-12 mt-2" onClick={onFinish}>
          Done
        </Button>
      )}
    </div>
  )
}
