import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { CloudCheck, CloudAlert, CloudOff, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { useSettings, useUpdateSettings } from '@/hooks/useSettings'
import { queryKeys } from '@/lib/query-keys'
import { syncNow } from '@/lib/sync-scheduler'
import type { WeightUnit } from '@/models/types'
import { cn } from '@/lib/utils'

const DEFAULT_SYNC_OWNER = 'ivancompanyavi'
const DEFAULT_SYNC_REPO = 'calisthenics-data'

export function Settings() {
  const { data: settings } = useSettings()
  const update = useUpdateSettings()
  const qc = useQueryClient()

  const unit = settings?.weightUnit ?? 'kg'
  const setUnit = (next: WeightUnit) => {
    if (next === unit) return
    update.mutate({ weightUnit: next })
  }

  const soundCues = settings?.soundCues ?? true
  const setSoundCues = (next: boolean) => {
    if (next === soundCues) return
    update.mutate({ soundCues: next })
  }

  const waitAfterRest = settings?.waitAfterRest ?? false
  const setWaitAfterRest = (next: boolean) => {
    if (next === waitAfterRest) return
    update.mutate({ waitAfterRest: next })
  }

  const remindersEnabled = settings?.workoutRemindersEnabled ?? false
  const notifDenied =
    typeof Notification !== 'undefined' && Notification.permission === 'denied'
  const setRemindersEnabled = async (next: boolean) => {
    if (next === remindersEnabled) return
    // Ask for notification permission when turning reminders on.
    if (next && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
    update.mutate({ workoutRemindersEnabled: next })
  }

  // ─── Coach sync (GitHub mirror) ──────────────────────────────────────────
  // The token is write-only from the UI's perspective: the input always
  // starts empty and is never populated from settings.githubSync.token, so a
  // saved token never round-trips back onto the screen. Leaving it blank on
  // save keeps whatever token is already stored.
  const githubSync = settings?.githubSync
  const syncEnabled = githubSync?.enabled ?? false
  const hasStoredToken = !!githubSync?.token
  const [ownerInput, setOwnerInput] = useState(DEFAULT_SYNC_OWNER)
  const [repoInput, setRepoInput] = useState(DEFAULT_SYNC_REPO)
  const [tokenInput, setTokenInput] = useState('')
  const [syncingNow, setSyncingNow] = useState(false)

  // useSettings() resolves asynchronously (IndexedDB read), so the useState
  // initializers above never see a real settings value on first render.
  // "Adjust state during render" (React's supported pattern for this, not an
  // effect — see https://react.dev/learn/you-might-not-need-an-effect) once
  // the query resolves for the first time, so a previously-saved owner/repo
  // populates the fields without stomping on text the user is editing later.
  const [hydrated, setHydrated] = useState(false)
  if (!hydrated && settings) {
    setHydrated(true)
    if (settings.githubSync?.owner) setOwnerInput(settings.githubSync.owner)
    if (settings.githubSync?.repo) setRepoInput(settings.githubSync.repo)
  }

  const isConfigured = syncEnabled && hasStoredToken && !!githubSync?.owner && !!githubSync?.repo

  const saveConnection = (patch: Partial<{ enabled: boolean }> = {}) => {
    const owner = ownerInput.trim() || DEFAULT_SYNC_OWNER
    const repo = repoInput.trim() || DEFAULT_SYNC_REPO
    const token = tokenInput.trim().length > 0 ? tokenInput.trim() : (githubSync?.token ?? '')
    update.mutate({
      githubSync: {
        token,
        owner,
        repo,
        enabled: githubSync?.enabled ?? false,
        lastSyncedAt: githubSync?.lastSyncedAt,
        pendingSync: githubSync?.pendingSync,
        lastError: githubSync?.lastError,
        ...patch,
      },
    })
    setTokenInput('')
  }

  const setSyncEnabled = (next: boolean) => {
    if (next === syncEnabled) return
    saveConnection({ enabled: next })
  }

  const handleSyncNow = async () => {
    setSyncingNow(true)
    try {
      await syncNow()
    } finally {
      setSyncingNow(false)
      qc.invalidateQueries({ queryKey: queryKeys.settings })
    }
  }

  return (
    <div>
      <PageHeader title="Settings" />

      <div className="px-4 space-y-4 pb-8">
        <Card className="p-4">
          <div className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold">Weight unit</h2>
              <p className="text-xs text-muted-foreground">
                Used when logging machine, dumbbell, and bodyweight values. Stored
                internally as kg; the toggle only affects display + input.
              </p>
            </div>
            <div className="flex gap-2">
              <UnitButton active={unit === 'kg'} onClick={() => setUnit('kg')}>
                kg
              </UnitButton>
              <UnitButton active={unit === 'lb'} onClick={() => setUnit('lb')}>
                lb
              </UnitButton>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold">Sound &amp; haptic cues</h2>
              <p className="text-xs text-muted-foreground">
                Beeps and vibration at T&#8209;3 / T&#8209;2 / T&#8209;1 and end of rest and
                time&#8209;mode exercise countdowns. Silenced during count&#8209;up (max) sets.
              </p>
            </div>
            <div className="flex gap-2">
              <UnitButton active={soundCues} onClick={() => setSoundCues(true)}>
                On
              </UnitButton>
              <UnitButton active={!soundCues} onClick={() => setSoundCues(false)}>
                Off
              </UnitButton>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold">Workout reminders</h2>
              <p className="text-xs text-muted-foreground">
                Shows a notification naming today&#39;s workout when you open the app on a
                scheduled day. Fires while the app is open only — background reminders
                aren&#39;t possible without a server.
              </p>
            </div>
            <div className="flex gap-2">
              <UnitButton active={remindersEnabled} onClick={() => setRemindersEnabled(true)}>
                On
              </UnitButton>
              <UnitButton active={!remindersEnabled} onClick={() => setRemindersEnabled(false)}>
                Off
              </UnitButton>
            </div>
            {remindersEnabled && notifDenied && (
              <p className="text-xs text-destructive">
                Notifications are blocked in your browser settings — enable them for this
                site to receive reminders.
              </p>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold">Wait for tap after rest</h2>
              <p className="text-xs text-muted-foreground">
                When on, the rest timer freezes at 0:00 and waits for you to tap
                before starting the next exercise. When off (default), rest
                reaching zero automatically moves into the next exercise and
                starts its timer for time / max&#8209;hold sets.
              </p>
            </div>
            <div className="flex gap-2">
              <UnitButton active={waitAfterRest} onClick={() => setWaitAfterRest(true)}>
                On
              </UnitButton>
              <UnitButton active={!waitAfterRest} onClick={() => setWaitAfterRest(false)}>
                Off
              </UnitButton>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold">Coach sync</h2>
                <p className="text-xs text-muted-foreground">
                  Mirrors your training data (no photos) to a private GitHub repo as{' '}
                  <code className="text-[11px]">snapshot.json</code>, one&#8209;way, pushed
                  from this device after every workout or bodyweight log.
                </p>
              </div>
              <SyncStatusIcon
                enabled={syncEnabled}
                pending={githubSync?.pendingSync ?? false}
                hasError={!!githubSync?.lastError}
              />
            </div>

            <div className="flex gap-2">
              <UnitButton active={syncEnabled} onClick={() => setSyncEnabled(true)}>
                On
              </UnitButton>
              <UnitButton active={!syncEnabled} onClick={() => setSyncEnabled(false)}>
                Off
              </UnitButton>
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Owner</label>
                  <Input
                    value={ownerInput}
                    onChange={(e) => setOwnerInput(e.target.value)}
                    placeholder={DEFAULT_SYNC_OWNER}
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Repo</label>
                  <Input
                    value={repoInput}
                    onChange={(e) => setRepoInput(e.target.value)}
                    placeholder={DEFAULT_SYNC_REPO}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Fine&#8209;grained token
                </label>
                <Input
                  type="password"
                  autoComplete="off"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder={hasStoredToken ? 'Token saved — leave blank to keep it' : 'ghp_…'}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => saveConnection()}
              >
                Save connection
              </Button>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1 text-xs text-muted-foreground">
              <span>
                {githubSync?.lastSyncedAt
                  ? `Last synced ${new Date(githubSync.lastSyncedAt).toLocaleString()}`
                  : 'Never synced'}
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!isConfigured || syncingNow}
                onClick={handleSyncNow}
              >
                {syncingNow ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Syncing…
                  </span>
                ) : (
                  'Sync now'
                )}
              </Button>
            </div>
            {githubSync?.lastError && (
              <p className="text-xs text-destructive">{githubSync.lastError}</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

function SyncStatusIcon({
  enabled,
  pending,
  hasError,
}: {
  enabled: boolean
  pending: boolean
  hasError: boolean
}) {
  if (!enabled) {
    return <CloudOff className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
  }
  if (hasError) {
    return <CloudAlert className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
  }
  if (pending) {
    return <Loader2 className="h-4 w-4 text-muted-foreground animate-spin shrink-0 mt-0.5" />
  }
  return <CloudCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
}

function UnitButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      variant={active ? 'default' : 'outline'}
      onClick={onClick}
      className={cn('flex-1 uppercase tracking-wide', active && 'pointer-events-none')}
    >
      {children}
    </Button>
  )
}
