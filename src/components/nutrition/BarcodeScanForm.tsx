import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MealLabelPicker } from '@/components/nutrition/MealLabelPicker'
import { BarcodeScanner } from '@/components/nutrition/BarcodeScanner'
import { useAddFoodLog } from '@/hooks/useFoodLog'
import { useCreateCustomFood, useCustomFoods } from '@/hooks/useCustomFoods'
import { lookupBarcode, type ScannedFood } from '@/lib/open-food-facts'
import { ScanBarcode, Loader2, Check } from 'lucide-react'
import type { MealLabel } from '@/models/types'

// Fourth logging path: scan a barcode → look it up on Open Food Facts → review
// the product + portion → log (and optionally save it as a reusable custom
// food), or save it to the library without logging anything. Online lookup;
// the UI distinguishes "couldn't read a barcode" (scan problem) from "read it,
// but it's not in the database" (coverage gap), and offers manual barcode
// entry as both a workaround and a way to tell them apart.
type Phase = 'idle' | 'scanning' | 'looking-up' | 'review' | 'not-found' | 'error'

export function BarcodeScanForm({
  date,
  mealLabel,
  setMealLabel,
  onDone,
}: {
  date: number
  mealLabel: MealLabel | undefined
  setMealLabel: (v: MealLabel | undefined) => void
  onDone: () => void
}) {
  const addFoodLog = useAddFoodLog()
  const createCustomFood = useCreateCustomFood()
  const { data: customFoods } = useCustomFoods()
  const [phase, setPhase] = useState<Phase>('idle')
  const [barcode, setBarcode] = useState('')
  const [manualInput, setManualInput] = useState('')
  const [scanned, setScanned] = useState<ScannedFood | null>(null)
  const [grams, setGrams] = useState('100')
  const [saveToFoods, setSaveToFoods] = useState(true)
  const [savedThisScan, setSavedThisScan] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // CustomFood has no barcode field, so "already in the library" is matched by
  // name + brand (case-insensitive) — good enough to stop re-scans of the same
  // product from piling up duplicate library entries.
  const inLibrary = useMemo(() => {
    if (!scanned) return false
    const name = scanned.name.trim().toLowerCase()
    const brand = (scanned.brand ?? '').trim().toLowerCase()
    return (customFoods ?? []).some(
      (f) =>
        f.name.trim().toLowerCase() === name && (f.brand ?? '').trim().toLowerCase() === brand
    )
  }, [customFoods, scanned])
  const alreadySaved = inLibrary || savedThisScan

  // Shared by the scanner callback and manual entry — both feed the same
  // lookup. Reaching 'not-found'/'review' here proves the code was read.
  const lookup = async (code: string) => {
    const trimmed = code.trim()
    if (!trimmed) return
    setBarcode(trimmed)
    setPhase('looking-up')
    try {
      const food = await lookupBarcode(trimmed)
      if (!food) {
        setPhase('not-found')
        return
      }
      setScanned(food)
      setGrams('100')
      setSavedThisScan(false)
      setPhase('review')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Lookup failed')
      setPhase('error')
    }
  }

  const g = Number(grams)
  const scale = Number.isFinite(g) && g > 0 ? g / 100 : 0
  const r1 = (n: number) => Math.round(n * 10) / 10
  const preview =
    scanned && scale > 0
      ? {
          kcal: r1(scanned.kcal * scale),
          proteinG: r1(scanned.proteinG * scale),
          carbG: r1(scanned.carbG * scale),
          fatG: r1(scanned.fatG * scale),
          fiberG: r1(scanned.fiberG * scale),
          sodiumMg: scanned.sodiumMg != null ? r1(scanned.sodiumMg * scale) : undefined,
        }
      : null

  const saveToLibrary = async () => {
    if (!scanned || alreadySaved) return
    await createCustomFood.mutateAsync({
      name: scanned.name,
      brand: scanned.brand,
      per: 'per100g',
      kcal: scanned.kcal,
      proteinG: scanned.proteinG,
      carbG: scanned.carbG,
      fatG: scanned.fatG,
      fiberG: scanned.fiberG,
      sodiumMg: scanned.sodiumMg,
    })
    setSavedThisScan(true)
  }

  const submit = async () => {
    if (!scanned || !preview) return
    if (saveToFoods) {
      await saveToLibrary()
    }
    await addFoodLog.mutateAsync({
      date,
      mealLabel,
      source: 'barcode',
      refId: scanned.barcode,
      name: scanned.name,
      quantityG: g,
      kcal: preview.kcal,
      proteinG: preview.proteinG,
      carbG: preview.carbG,
      fatG: preview.fatG,
      fiberG: preview.fiberG,
      sodiumMg: preview.sodiumMg,
    })
    onDone()
  }

  // Manual barcode entry — a workaround when the camera won't read the code,
  // and a diagnostic: if a typed number is found, the earlier failure was the
  // scan, not the database.
  const manualEntry = (
    <div className="flex gap-2">
      <Input
        type="text"
        inputMode="numeric"
        placeholder="Barcode number"
        value={manualInput}
        onChange={(e) => setManualInput(e.target.value)}
      />
      <Button variant="outline" disabled={!manualInput.trim()} onClick={() => lookup(manualInput)}>
        Look up
      </Button>
    </div>
  )

  if (phase === 'scanning') {
    return <BarcodeScanner onDetected={lookup} onCancel={() => setPhase('idle')} />
  }

  if (phase === 'looking-up') {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Looking up {barcode}…</span>
      </div>
    )
  }

  if (phase === 'not-found' || phase === 'error') {
    return (
      <div className="space-y-3 py-2">
        {phase === 'not-found' ? (
          <p className="text-sm text-muted-foreground text-center">
            Read barcode <span className="text-foreground tabular-nums">{barcode}</span> — the scan
            worked, but it isn&#39;t in the Open Food Facts database. Add it via Quick add or Search,
            or try another number below.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground text-center">
            Couldn&#39;t reach the product database: {errorMsg}. Check your connection and try again.
          </p>
        )}
        {manualEntry}
        <Button variant="outline" className="w-full" onClick={() => setPhase('scanning')}>
          Scan again
        </Button>
      </div>
    )
  }

  if (phase === 'review' && scanned) {
    return (
      <div className="space-y-3 mt-3">
        <div>
          <p className="text-sm font-medium">{scanned.name}</p>
          {scanned.brand && <p className="text-xs text-muted-foreground">{scanned.brand}</p>}
          <p className="text-[11px] text-muted-foreground tabular-nums mt-0.5">
            #{barcode} · Per 100 g: {Math.round(scanned.kcal)} kcal · P{Math.round(scanned.proteinG)}/C
            {Math.round(scanned.carbG)}/F{Math.round(scanned.fatG)}
          </p>
        </div>
        <label className="block">
          <span className="text-xs text-muted-foreground mb-1 block">Grams</span>
          <Input type="number" inputMode="decimal" step="1" value={grams} onChange={(e) => setGrams(e.target.value)} autoFocus />
        </label>
        {preview && (
          <p className="text-xs text-muted-foreground tabular-nums">
            {Math.round(preview.kcal)} kcal · P{Math.round(preview.proteinG)} · C{Math.round(preview.carbG)} · F
            {Math.round(preview.fatG)} · Fiber {Math.round(preview.fiberG)}
            {preview.sodiumMg != null ? ` · Na ${Math.round(preview.sodiumMg)}mg` : ''}
          </p>
        )}
        <MealLabelPicker value={mealLabel} onChange={setMealLabel} />
        {alreadySaved ? (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Check className="h-3.5 w-3.5" /> In your custom foods — log it offline next time
          </p>
        ) : (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={saveToFoods} onChange={(e) => setSaveToFoods(e.target.checked)} />
            Save to my foods (log it offline next time)
          </label>
        )}
        <Button className="w-full" onClick={submit} disabled={scale <= 0 || addFoodLog.isPending}>
          Add food
        </Button>
        {!alreadySaved && (
          <Button
            variant="outline"
            className="w-full"
            onClick={saveToLibrary}
            disabled={createCustomFood.isPending}
          >
            Save to my foods without logging
          </Button>
        )}
        <button type="button" className="w-full text-xs text-muted-foreground underline" onClick={() => setPhase('scanning')}>
          Scan a different item
        </button>
      </div>
    )
  }

  // idle
  return (
    <div className="space-y-3 mt-3 py-2">
      <p className="text-xs text-muted-foreground text-center">
        Scan a packaged product&#39;s barcode to look up its nutrition (via Open Food Facts). Needs a
        connection and camera access.
      </p>
      <Button className="w-full" onClick={() => setPhase('scanning')}>
        <ScanBarcode className="h-4 w-4 mr-1" /> Scan barcode
      </Button>
      <p className="text-[11px] text-muted-foreground text-center">or enter the barcode number</p>
      {manualEntry}
    </div>
  )
}
