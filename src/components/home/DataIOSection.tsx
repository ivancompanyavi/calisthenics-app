import { useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/components/ui/confirm-context'
import { Download, Upload } from 'lucide-react'
import { exportAllData, importAllData, downloadJson } from '@/lib/data-transfer'
import { showToast } from '@/lib/toast'

export function DataIOSection() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const confirm = useConfirm()

  const handleExport = async () => {
    const json = await exportAllData()
    const date = new Date().toISOString().split('T')[0]
    downloadJson(json, `calisthenics-backup-${date}.json`)
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const ok = await confirm({
      title: 'Replace all data with this backup?',
      description: 'Your current movements, workouts, programs, and history will be replaced.',
      confirmLabel: 'Replace',
      destructive: true,
    })
    if (!ok) {
      e.target.value = ''
      return
    }
    try {
      const text = await file.text()
      await importAllData(text)
      queryClient.invalidateQueries()
      showToast('Data imported successfully', 'success')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid file format'
      showToast(`Import failed: ${message}`, 'error')
    }
    e.target.value = ''
  }

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">Data</h2>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1" />
          Export
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-4 w-4 mr-1" />
          Import
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImportFile}
        />
      </div>
    </section>
  )
}
