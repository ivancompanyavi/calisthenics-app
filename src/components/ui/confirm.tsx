import { type ReactNode, useCallback, useRef, useState } from 'react'
import { Dialog } from './dialog'
import { Button } from './button'
import { ConfirmContext, type ConfirmFn, type ConfirmOptions } from './confirm-context'

// Imperative confirm primitive — `confirm(opts)` returns a Promise<boolean>
// that resolves when the user clicks Confirm/Cancel (or dismisses the dialog).
// Replaces native `window.confirm` so destructive actions look like the rest
// of the app instead of an OS-level prompt that breaks the dark-mode design.
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolverRef = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback<ConfirmFn>((opts) => {
    return new Promise((resolve) => {
      // If a previous confirm is still pending (shouldn't normally happen),
      // resolve it as cancelled so we don't leave a dangling promise.
      resolverRef.current?.(false)
      resolverRef.current = resolve
      setOptions(opts)
    })
  }, [])

  const answer = (value: boolean) => {
    const resolver = resolverRef.current
    resolverRef.current = null
    setOptions(null)
    resolver?.(value)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog open={!!options} onClose={() => answer(false)}>
        {options && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{options.title}</h3>
            {options.description && (
              <p className="text-sm text-muted-foreground">{options.description}</p>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => answer(false)}>
                {options.cancelLabel ?? 'Cancel'}
              </Button>
              <Button
                variant={options.destructive ? 'destructive' : 'default'}
                onClick={() => answer(true)}
                autoFocus
              >
                {options.confirmLabel ?? 'Confirm'}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </ConfirmContext.Provider>
  )
}
