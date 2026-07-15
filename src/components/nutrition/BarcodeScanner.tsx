import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import type { IScannerControls } from '@zxing/browser'

// The `zoom` camera capability isn't in TypeScript's DOM lib yet, so extend
// the built-in types where we touch it. Runtime support: Android Chrome and
// iOS Safari 17+; elsewhere getCapabilities() simply omits `zoom` and no
// zoom UI renders.
interface ZoomRange {
  min: number
  max: number
  step: number
}
type CapabilitiesWithZoom = MediaTrackCapabilities & { zoom?: ZoomRange }

const ZOOM_PRESETS = [1, 2, 3, 5]

// Camera barcode scanner via @zxing/browser (pure JS, no WASM). Works
// cross-platform including iOS Safari — where the native BarcodeDetector API is
// unavailable. The heavy reader is lazy-loaded (dynamic import) so it only
// ships when the user actually opens the scanner.
//
// Zoom: small barcodes force the phone inside the camera's minimum focus
// distance, and the image blurs beyond decoding. Optical/sensor zoom (where
// the track supports it) crops at the sensor instead, so we default to 2× and
// offer presets rather than making the user lean in.
export function BarcodeScanner({
  onDetected,
  onCancel,
}: {
  onDetected: (barcode: string) => void
  onCancel: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const trackRef = useRef<MediaStreamTrack | null>(null)
  const [zoomRange, setZoomRange] = useState<ZoomRange | null>(null)
  const [zoom, setZoom] = useState(1)
  const [error, setError] = useState<string | null>(null)
  // Surfaces the "we're not getting a read" case: if no barcode decodes within
  // a few seconds, show guidance so the user knows it's the scan (not the
  // lookup) that's stuck.
  const [stalled, setStalled] = useState(false)

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
    const stallTimer = setTimeout(() => {
      if (!cancelled) setStalled(true)
    }, 6000)

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
        if (cancelled) return

        const stream = videoRef.current.srcObject as MediaStream | null
        const track = stream?.getVideoTracks()[0] ?? null
        trackRef.current = track
        const caps = track?.getCapabilities?.() as CapabilitiesWithZoom | undefined
        if (track && caps?.zoom && caps.zoom.max > caps.zoom.min) {
          setZoomRange(caps.zoom)
          // Start at 2× (clamped): the common case for scanning is a small
          // barcode, and 1× is one tap away if the framing gets too tight.
          const initial = Math.max(caps.zoom.min, Math.min(2, caps.zoom.max))
          try {
            await track.applyConstraints({ advanced: [{ zoom: initial } as MediaTrackConstraintSet] })
            if (!cancelled) setZoom(initial)
          } catch {
            // Zoom is best-effort; the scanner still works at the default.
          }
        }
      } catch {
        if (!cancelled) setError('Camera access was denied or is unavailable.')
      }
    })()

    return () => {
      cancelled = true
      clearTimeout(stallTimer)
      controls?.stop()
    }
  }, [])

  const applyZoom = async (value: number) => {
    const track = trackRef.current
    if (!track) return
    try {
      await track.applyConstraints({ advanced: [{ zoom: value } as MediaTrackConstraintSet] })
      setZoom(value)
    } catch {
      // Some devices reject values inside the advertised range; keep the
      // current zoom rather than surfacing an error mid-scan.
    }
  }

  const zoomPresets = zoomRange
    ? ZOOM_PRESETS.filter((z) => z >= zoomRange.min && z <= zoomRange.max)
    : []

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-lg bg-black aspect-[4/3]">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
        <div className="pointer-events-none absolute inset-x-6 top-1/2 h-0.5 -translate-y-1/2 bg-red-500/70" />
        {zoomPresets.length > 1 && (
          <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1.5">
            {zoomPresets.map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => void applyZoom(z)}
                className={`rounded-full px-2.5 py-1 text-xs tabular-nums transition-colors ${
                  zoom === z ? 'bg-white text-black' : 'bg-black/50 text-white'
                }`}
              >
                {z}×
              </button>
            ))}
          </div>
        )}
      </div>
      {error ? (
        <p className="text-sm text-destructive text-center">{error}</p>
      ) : stalled ? (
        <p className="text-xs text-amber-500 text-center">
          No barcode read yet — center it in the frame, hold steady with good light, and avoid glare.
          {zoomPresets.length > 1
            ? ' Small barcode? Zoom in instead of moving the phone closer — up close the camera can’t focus.'
            : ''}{' '}
          Still nothing? Cancel and type the number in manually.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground text-center">Point the rear camera at a barcode.</p>
      )}
      <Button variant="ghost" className="w-full" onClick={onCancel}>
        <X className="h-4 w-4 mr-1" /> Cancel
      </Button>
    </div>
  )
}
