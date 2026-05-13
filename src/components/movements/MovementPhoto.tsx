import { useEffect, useMemo, useState } from 'react'
import { Dumbbell } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MovementPhotoProps {
  photo?: Blob
  seedImagePath?: string
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-10 w-10',
  md: 'h-16 w-16',
  lg: 'h-24 w-24',
}

const iconSizes = {
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
}

export function MovementPhoto({
  photo,
  seedImagePath,
  name,
  size = 'md',
  className,
}: MovementPhotoProps) {
  const photoUrl = useMemo(() => {
    if (!photo) return null
    return URL.createObjectURL(photo)
  }, [photo])

  useEffect(() => {
    if (!photoUrl) return
    return () => URL.revokeObjectURL(photoUrl)
  }, [photoUrl])

  const [failedSeedPath, setFailedSeedPath] = useState<string>()
  const seedImageUsable =
    !!seedImagePath && failedSeedPath !== seedImagePath
  const src = photoUrl ?? (seedImageUsable ? seedImagePath : null)

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => {
          if (!photoUrl && seedImagePath) setFailedSeedPath(seedImagePath)
        }}
        className={cn('rounded-lg object-cover flex-shrink-0', sizeClasses[size], className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'rounded-lg bg-secondary flex items-center justify-center flex-shrink-0',
        sizeClasses[size],
        className
      )}
    >
      <Dumbbell className={cn('text-muted-foreground', iconSizes[size])} />
    </div>
  )
}
