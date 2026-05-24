import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useWorkout, useWorkoutBlocks, useAllBlockEntries, useSaveWorkout, type SaveWorkoutData } from '@/hooks/useWorkouts'
import type { SaveEntry } from '@/repositories/workouts.repository'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BlockEditor } from '@/components/workouts/BlockEditor'
import { Plus, Save, ArrowLeft } from 'lucide-react'
import { generateId } from '@/lib/utils'
import type { BlockEntry, DraftBlock, DraftEntry } from '@/models/types'

interface InitialFormData {
  name: string
  restBetweenBlocks: number
  blocks: DraftBlock[]
}

// Outer loader: when editing, waits for workout + blocks + entries before
// mounting the form. The inner component derives all useState initial values
// from props so we never need a hydration effect.
export function WorkoutBuilder() {
  const { id } = useParams<{ id: string }>()
  const isEditing = !!id

  const { data: existingWorkout } = useWorkout(id)
  const { data: existingBlocks } = useWorkoutBlocks(id)
  const blockIds = existingBlocks?.map((b) => b.id) ?? []
  const { data: existingEntries } = useAllBlockEntries(blockIds)

  if (isEditing && (!existingWorkout || !existingBlocks || !existingEntries)) return null

  const toDraftEntry = (e: BlockEntry): DraftEntry => {
    const shared = {
      id: e.id,
      targetReps: e.targetReps,
      targetSeconds: e.targetSeconds,
      perSide: e.perSide,
      restSeconds: e.restSeconds,
      targetWeightKg: e.targetWeightKg,
      targetBandLevel: e.targetBandLevel,
    }
    return e.kind === 'progression'
      ? { ...shared, kind: 'progression', progressionId: e.progressionId }
      : { ...shared, kind: 'movement', movementId: e.movementId, mode: e.mode }
  }

  const initial: InitialFormData = isEditing && existingWorkout && existingBlocks && existingEntries
    ? {
        name: existingWorkout.name,
        restBetweenBlocks: existingWorkout.restBetweenBlocksSeconds ?? 0,
        blocks: existingBlocks.map((block) => ({
          id: block.id,
          type: block.type,
          rounds: block.rounds,
          restSeconds: block.restSeconds,
          entries: existingEntries
            .filter((e) => e.blockId === block.id)
            .map(toDraftEntry),
        })),
      }
    : { name: '', restBetweenBlocks: 0, blocks: [] }

  return <WorkoutBuilderInner id={id} initial={initial} />
}

function WorkoutBuilderInner({ id, initial }: { id: string | undefined; initial: InitialFormData }) {
  const navigate = useNavigate()
  const isEditing = !!id

  const saveWorkout = useSaveWorkout()

  const [name, setName] = useState(initial.name)
  const [restBetweenBlocks, setRestBetweenBlocks] = useState(initial.restBetweenBlocks)
  const [blocks, setBlocks] = useState<DraftBlock[]>(initial.blocks)

  const addBlock = (type: 'set' | 'superset') => {
    setBlocks((prev) => [
      ...prev,
      {
        id: generateId(),
        type,
        rounds: 1,
        restSeconds: 60,
        entries: [],
      },
    ])
  }

  const updateBlock = (blockId: string, updates: Partial<DraftBlock>) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, ...updates } : b))
    )
  }

  const removeBlock = (blockId: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== blockId))
  }

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= blocks.length) return
    setBlocks((prev) => {
      const next = [...prev]
      ;[next[index], next[newIndex]] = [next[newIndex], next[index]]
      return next
    })
  }

  const handleSave = async () => {
    if (!name.trim() || blocks.length === 0) return

    const toSaveEntry = (e: DraftEntry): SaveEntry => {
      const shared = {
        targetReps: e.targetReps,
        targetSeconds: e.targetSeconds,
        perSide: e.perSide || undefined,
        restSeconds: e.restSeconds,
        targetWeightKg: e.targetWeightKg,
        targetBandLevel: e.targetBandLevel,
      }
      return e.kind === 'progression'
        ? { ...shared, kind: 'progression', progressionId: e.progressionId }
        : { ...shared, kind: 'movement', movementId: e.movementId, mode: e.mode }
    }

    const data: SaveWorkoutData & { id?: string } = {
      id: isEditing ? id : undefined,
      name: name.trim(),
      restBetweenBlocksSeconds: restBetweenBlocks > 0 ? restBetweenBlocks : undefined,
      blocks: blocks.map((b) => ({
        type: b.type,
        rounds: b.rounds,
        restSeconds: b.restSeconds,
        entries: b.entries.map(toSaveEntry),
      })),
    }

    await saveWorkout.mutateAsync(data)
    navigate('/workouts')
  }

  return (
    <div>
      <PageHeader title={isEditing ? 'Edit Workout' : 'New Workout'}>
        <Button variant="ghost" size="icon" onClick={() => navigate('/workouts')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </PageHeader>

      <div className="px-4 space-y-4 pb-8">
        <div className="flex gap-3">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">Workout Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Full Body A"
            />
          </div>
          <div className="w-28 space-y-2">
            <label className="text-sm font-medium">Block Rest</label>
            <Input
              type="number"
              min={0}
              step={15}
              value={restBetweenBlocks}
              onChange={(e) => setRestBetweenBlocks(Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="sec"
            />
          </div>
        </div>

        <div className="space-y-3">
          {blocks.map((block, i) => (
            <BlockEditor
              key={block.id}
              block={block}
              index={i}
              totalBlocks={blocks.length}
              onUpdate={(updates) => updateBlock(block.id, updates)}
              onRemove={() => removeBlock(block.id)}
              onMove={(dir) => moveBlock(i, dir)}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => addBlock('set')}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Set
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => addBlock('superset')}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Superset
          </Button>
        </div>

        <Button
          className="w-full"
          size="lg"
          disabled={!name.trim() || blocks.length === 0 || blocks.some((b) => b.entries.length === 0)}
          onClick={handleSave}
        >
          <Save className="h-4 w-4 mr-2" />
          {isEditing ? 'Save Changes' : 'Save Workout'}
        </Button>
      </div>
    </div>
  )
}
