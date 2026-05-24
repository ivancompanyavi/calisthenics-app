import { useState, useRef } from 'react'
import { useCreateMovement, useUpdateMovement } from '@/hooks/useMovements'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DialogTitle } from '@/components/ui/dialog'
import { Camera } from 'lucide-react'
import { MovementPhoto } from './MovementPhoto'
import type { Movement } from '@/models/types'

interface MovementFormProps {
  movement?: Movement
  onDone: () => void
}

export function MovementForm({ movement, onDone }: MovementFormProps) {
  const [name, setName] = useState(movement?.name ?? '')
  const [description, setDescription] = useState(movement?.description ?? '')
  const [referenceUrl, setReferenceUrl] = useState(movement?.referenceUrl ?? '')
  const [photo, setPhoto] = useState<Blob | undefined>(movement?.photo)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const createMovement = useCreateMovement()
  const updateMovement = useUpdateMovement()
  const isEditing = !!movement

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhoto(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const trimmedUrl = referenceUrl.trim()
    if (isEditing) {
      await updateMovement.mutateAsync({
        id: movement.id,
        name: name.trim(),
        description: description.trim() || undefined,
        referenceUrl: trimmedUrl || undefined,
        photo,
      })
    } else {
      await createMovement.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        referenceUrl: trimmedUrl || undefined,
        photo,
      })
    }
    onDone()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogTitle>{isEditing ? 'Edit Movement' : 'New Movement'}</DialogTitle>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative group"
        >
          <MovementPhoto
            photo={photo}
            seedImagePath={movement?.seedImagePath}
            name={name || 'New'}
            size="lg"
          />
          <div className="absolute inset-0 rounded-lg bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
            <Camera className="h-6 w-6 text-white" />
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          className="hidden"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Name *</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Push-Ups"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Form reference URL</label>
        <Input
          type="url"
          inputMode="url"
          value={referenceUrl}
          onChange={(e) => setReferenceUrl(e.target.value)}
          placeholder="https://youtube.com/..."
        />
      </div>

      <Button type="submit" className="w-full" size="lg">
        {isEditing ? 'Save Changes' : 'Create Movement'}
      </Button>
    </form>
  )
}
