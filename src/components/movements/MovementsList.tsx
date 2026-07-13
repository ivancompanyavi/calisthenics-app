import { useEffect, useRef, useState } from 'react'
import { useMovements, useDeleteMovement } from '@/hooks/useMovements'
import { useMovementPRs } from '@/hooks/useHistory'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { useConfirm } from '@/components/ui/confirm-context'
import { MovementForm } from './MovementForm'
import { Plus, Pencil, Trash2, Trophy, Video } from 'lucide-react'
import type { Movement } from '@/models/types'
import { MovementPhoto } from './MovementPhoto'

// How many rows to render initially and to reveal per "load more" step. The
// full seed is ~230 movements; rendering all at once (each with its own image)
// is what made the Library tab lag on mobile.
const BATCH = 40

export function MovementsList() {
  const { data: movements, isLoading } = useMovements()
  const { data: prs } = useMovementPRs()
  const deleteMovement = useDeleteMovement()
  const confirm = useConfirm()
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null)
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')
  const [visibleCount, setVisibleCount] = useState(BATCH)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Reset the window whenever the search query changes so results start at the
  // top rather than mid-list. Done during render (React's supported pattern for
  // resetting state on a derived change) rather than in an effect.
  const [prevSearch, setPrevSearch] = useState(search)
  if (search !== prevSearch) {
    setPrevSearch(search)
    setVisibleCount(BATCH)
  }

  const filtered = movements?.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  )

  const total = filtered?.length ?? 0
  const shown = filtered ? filtered.slice(0, visibleCount) : []
  const hasMore = total > shown.length

  // Infinite scroll: reveal the next batch as the sentinel approaches the
  // viewport. Re-runs as the window grows so the (re-rendered, lower) sentinel
  // is re-observed. rootMargin prefetches just before it scrolls into view.
  useEffect(() => {
    if (!hasMore) return
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setVisibleCount((c) => c + BATCH)
      },
      { rootMargin: '400px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, shown.length])

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">Loading...</div>
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Search movements..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Button size="icon" onClick={() => setCreating(true)}>
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {filtered?.length === 0 && (
        <div className="py-8 text-center text-muted-foreground text-sm">
          {search ? 'No movements match your search.' : 'No movements yet.'}
        </div>
      )}

      {shown.map((movement) => {
        const pr = prs?.get(movement.id)
        return (
        <Card key={movement.id} className="p-3">
          <div className="flex items-center gap-3">
            <MovementPhoto
              photo={movement.photo}
              seedImagePath={movement.seedImagePath}
              name={movement.name}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{movement.name}</p>
              {movement.description && (
                <p className="text-xs text-muted-foreground truncate">{movement.description}</p>
              )}
              {(pr?.bestReps != null || pr?.bestSeconds != null) && (
                <p className="text-[11px] mt-1 flex items-center gap-1 text-amber-400/90">
                  <Trophy className="h-3 w-3 shrink-0" />
                  <span className="font-mono tabular-nums">
                    PR
                    {pr.bestReps != null && ` ${pr.bestReps} reps`}
                    {pr.bestReps != null && pr.bestSeconds != null && ' ·'}
                    {pr.bestSeconds != null && ` ${pr.bestSeconds}s`}
                  </span>
                  {(pr.bestRepsTestDay || pr.bestSecondsTestDay) && (
                    <span className="text-[10px] font-medium px-1 rounded bg-amber-400/20 text-amber-400 leading-4">
                      tested
                    </span>
                  )}
                </p>
              )}
              {movement.referenceUrl && (
                <a
                  href={movement.referenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] mt-1 inline-flex items-center gap-1 text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Video className="h-3 w-3 shrink-0" />
                  Form check
                </a>
              )}
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setEditingMovement(movement)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-destructive"
                onClick={async () => {
                  if (await confirm({
                    title: `Delete "${movement.name}"?`,
                    confirmLabel: 'Delete',
                    destructive: true,
                  })) {
                    deleteMovement.mutate(movement.id)
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
        )
      })}

      {hasMore && (
        <div ref={sentinelRef} className="pt-1 pb-3 flex justify-center">
          <Button variant="outline" size="sm" onClick={() => setVisibleCount((c) => c + BATCH)}>
            Load more ({total - shown.length})
          </Button>
        </div>
      )}

      <Dialog open={creating} onClose={() => setCreating(false)}>
        <MovementForm onDone={() => setCreating(false)} />
      </Dialog>

      <Dialog open={!!editingMovement} onClose={() => setEditingMovement(null)}>
        {editingMovement && (
          <MovementForm
            movement={editingMovement}
            onDone={() => setEditingMovement(null)}
          />
        )}
      </Dialog>
    </div>
  )
}
