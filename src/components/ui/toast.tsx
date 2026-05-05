import { useEffect, useState, useCallback } from 'react'
import { X } from 'lucide-react'
import { toastListeners, type Toast, type ToastListener } from '@/lib/toast'

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const handler: ToastListener = (toast) => {
      setToasts((prev) => [...prev, toast])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id))
      }, 4000)
    }
    toastListeners.add(handler)
    return () => { toastListeners.delete(handler) }
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-lg px-4 py-3 text-sm font-medium shadow-lg flex items-center justify-between animate-in slide-in-from-bottom-2 ${
            toast.type === 'error'
              ? 'bg-destructive text-destructive-foreground'
              : toast.type === 'success'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground'
          }`}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => dismiss(toast.id)}
            className="ml-3 shrink-0 opacity-70 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
