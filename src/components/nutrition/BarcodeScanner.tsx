import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import type { IScannerControls } from '@zxing/browser'

// Camera barcode scanner via @zxing/browser (pure JS, no WASM). Works
// cross-platform including iOS Safari — where the native BarcodeDetector API is
// unavailable. The heavy reader is lazy-loaded (dynamic import) so it only
// ships when the user actually opens the scanner.
export function BarcodeScanner({
  onDetected,
  onCancel,
}: {
  onDetected: (barcode: string) => void
  onCancel: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)

  // Keep the latest callback in a ref so the camera effect can run exactly once
  // on mount (an inline onDetected changes every render and would otherwise
  // restart the camera in a loop).
  const onDetectedRef = useRef(onDetected)
  useEffect(() => {
    onDetectedRef.current = onDetected
  }, [onDetected])

  useEffect(() => {
    let controls: IScannerControls | null = null
    let cancelled = false

    void (async () => {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser')
        if (cancelled || !videoRef.current) return
        const reader = new BrowserMultiFormatReader()
        controls = await reader.decodeFromConstraints(
          { video: { facingMode: 'environment' } },
          videoRef.current,
          (result, _err, ctrls) => {
            if (result) {
              ctrls.stop()
              onDetectedRef.current(result.getText())
            }
          },
        )
      } catch {
        if (!cancelled) setError('Camera access was denied or is unavailable.')
      }
    })()

    return () => {
      cancelled = true
      controls?.stop()
    }
  }, [])

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-lg bg-black aspect-[4/3]">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
        <div className="pointer-events-none absolute inset-x-6 top-1/2 h-0.5 -translate-y-1/2 bg-red-500/70" />
      </div>
      {error ? (
        <p className="text-sm text-destructive text-center">{error}</p>
      ) : (
        <p className="text-xs text-muted-foreground text-center">Point the rear camera at a barcode.</p>
      )}
      <Button variant="ghost" className="w-full" onClick={onCancel}>
        <X className="h-4 w-4 mr-1" /> Cancel
      </Button>
    </div>
  )
}
