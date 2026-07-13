import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface DialogProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
}

export function Dialog({ open, onClose, children, className }: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  // Track the visual viewport so the bottom sheet stays ABOVE the on-screen
  // keyboard. iOS Safari shrinks only the visual viewport on keyboard open (not
  // the layout viewport that `fixed` anchors to), so without this the sheet —
  // and any search results below its input — sit hidden behind the keyboard.
  const [viewport, setViewport] = useState<{ top: number; height: number } | null>(null)

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const vv = window.visualViewport
    const sync = () => {
      if (vv) setViewport({ top: vv.offsetTop, height: vv.height })
    }
    sync()
    vv?.addEventListener('resize', sync)
    vv?.addEventListener('scroll', sync)
    return () => {
      document.body.style.overflow = ''
      vv?.removeEventListener('resize', sync)
      vv?.removeEventListener('scroll', sync)
    }
  }, [open])

  if (!open) return null

  // Pin the overlay to the visible viewport (falls back to full height before
  // the first measurement / where visualViewport is unavailable). `items-end`
  // then anchors the sheet to the bottom of the *visible* area, i.e. just above
  // the keyboard, and the sheet scrolls internally within it.
  const overlayStyle: CSSProperties = viewport
    ? { top: viewport.top, height: viewport.height }
    : { top: 0, height: '100dvh' }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-x-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      style={overlayStyle}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
    >
      <div
        className={cn(
          'w-full max-w-lg rounded-t-2xl bg-card p-6 animate-in slide-in-from-bottom duration-200 max-h-full overflow-y-auto',
          className
        )}
      >
        <div className="flex justify-end mb-2">
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function DialogTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={cn('text-xl font-bold mb-4', className)}>{children}</h2>
  )
}
