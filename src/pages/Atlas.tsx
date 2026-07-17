import { useState } from 'react'
import { CheckCircle2, Circle, Clock, Lock, ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogTitle } from '@/components/ui/dialog'
import { useSkillAtlas } from '@/hooks/useSkillAtlas'
import type { ResolvedSkillResult, ResolvedPrerequisite } from '@/hooks/useSkillAtlas'
import type { SkillStatus } from '@/lib/skill-atlas'
import type { Skill, SkillTier } from '@/models/types'

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  SkillStatus,
  { label: string; icon: typeof CheckCircle2; iconClass: string; sectionClass: string }
> = {
  achieved: {
    label: 'Achieved',
    icon: CheckCircle2,
    iconClass: 'text-emerald-400',
    sectionClass: 'border-emerald-800/40',
  },
  'in-reach': {
    label: 'In Reach',
    icon: Clock,
    iconClass: 'text-yellow-400',
    sectionClass: 'border-yellow-800/40',
  },
  blocked: {
    label: 'Locked',
    icon: Lock,
    iconClass: 'text-muted-foreground',
    sectionClass: 'border-border',
  },
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ progress, met }: { progress: number; met: boolean }) {
  const pct = Math.round(progress * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${met ? 'bg-emerald-400' : 'bg-primary'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-9 text-right">{pct}%</span>
    </div>
  )
}

// ── Prerequisite row inside the detail sheet ──────────────────────────────────

function PrerequisiteRow({ result }: { result: ResolvedPrerequisite }) {
  const { met, progress, label, detail } = result

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {met ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <span className="text-sm truncate">{label}</span>
        </div>
      </div>
      {detail && (
        <p className="text-xs text-muted-foreground pl-6">{detail}</p>
      )}
      <div className="pl-6">
        <ProgressBar progress={progress} met={met} />
      </div>
    </div>
  )
}

// ── Detail sheet ──────────────────────────────────────────────────────────────

interface DetailSheetProps {
  skill: Skill
  result: ResolvedSkillResult
  onClose: () => void
}

function DetailSheet({ skill, result, onClose }: DetailSheetProps) {
  const config = STATUS_CONFIG[result.status]
  const StatusIcon = config.icon

  return (
    <Dialog open onClose={onClose}>
      <div className="flex items-center gap-3 mb-4">
        <StatusIcon className={`h-6 w-6 shrink-0 ${config.iconClass}`} />
        <DialogTitle className="mb-0">{skill.name}</DialogTitle>
      </div>

      {skill.description && (
        <p className="text-sm text-muted-foreground mb-5">{skill.description}</p>
      )}

      {result.prerequisites.length === 0 ? (
        <p className="text-sm text-muted-foreground">No prerequisites.</p>
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Prerequisites
          </h3>
          {result.prerequisites.map((pr, i) => (
            <PrerequisiteRow key={i} result={pr} />
          ))}
        </div>
      )}
    </Dialog>
  )
}

// ── Skill card ────────────────────────────────────────────────────────────────

interface SkillCardProps {
  skill: Skill
  result: ResolvedSkillResult
  onTap: () => void
}

function SkillCard({ skill, result, onTap }: SkillCardProps) {
  const config = STATUS_CONFIG[result.status]
  const StatusIcon = config.icon

  // Overall progress: average of prerequisite progresses. If no prerequisites,
  // it's trivially 100%.
  const overallProgress =
    result.prerequisites.length === 0
      ? 1
      : result.prerequisites.reduce((sum, p) => sum + p.progress, 0) /
        result.prerequisites.length

  return (
    <button
      onClick={onTap}
      className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
    >
      <Card className={`border ${config.sectionClass} transition-colors hover:bg-card/80 active:bg-card/60`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <StatusIcon className={`h-5 w-5 shrink-0 ${config.iconClass}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-sm truncate">{skill.name}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
              {result.status !== 'achieved' && result.prerequisites.length > 0 && (
                <div className="mt-2">
                  <ProgressBar progress={overallProgress} met={false} />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </button>
  )
}

// ── Tier grouping ───────────────────────────────────────────────────────────

const TIER_ORDER: SkillTier[] = ['foundation', 'intermediate', 'advanced', 'elite']
const TIER_LABEL: Record<SkillTier, string> = {
  foundation: 'Foundation',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  elite: 'Elite',
}
// Legacy rows without a tier fall into 'intermediate'.
const tierOf = (s: Skill): SkillTier => s.tier ?? 'intermediate'
// Within a tier, surface what's next-up before what's done.
const STATUS_SORT: Record<SkillStatus, number> = { 'in-reach': 0, blocked: 1, achieved: 2 }

interface TierSectionProps {
  tier: SkillTier
  skills: Skill[]
  results: ResolvedSkillResult[]
  onTap: (skillId: string) => void
}

function TierSection({ tier, skills, results, onTap }: TierSectionProps) {
  if (skills.length === 0) return null
  const statusOf = (id: string) => results.find((r) => r.skillId === id)?.status ?? 'blocked'
  const achieved = skills.filter((s) => statusOf(s.id) === 'achieved').length
  const sorted = [...skills].sort(
    (a, b) => STATUS_SORT[statusOf(a.id)] - STATUS_SORT[statusOf(b.id)],
  )

  return (
    <section className="mb-6">
      <h2 className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 px-1">
        <span>{TIER_LABEL[tier]}</span>
        <span className="tabular-nums">
          {achieved}/{skills.length}
        </span>
      </h2>
      <div className="space-y-2">
        {sorted.map((skill) => (
          <SkillCard
            key={skill.id}
            skill={skill}
            result={results.find((r) => r.skillId === skill.id)!}
            onTap={() => onTap(skill.id)}
          />
        ))}
      </div>
    </section>
  )
}

// ── Overall unlock summary ────────────────────────────────────────────────────

function UnlockSummary({ achieved, total }: { achieved: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((achieved / total) * 100)
  return (
    <div className="mb-6 mt-1">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium">Skills unlocked</span>
        <span className="text-sm tabular-nums text-muted-foreground">
          {achieved} / {total}
        </span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-emerald-400 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function AtlasPage() {
  const { data, isLoading } = useSkillAtlas()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedSkill = data?.skills.find((s) => s.id === selectedId)
  const selectedResult = data?.results.find((r) => r.skillId === selectedId)

  const achievedCount =
    data?.results.filter((r) => r.status === 'achieved').length ?? 0

  return (
    <div>
      <PageHeader title="Skill Atlas" />
      <div className="px-4 pb-4">
        {isLoading && (
          <p className="text-muted-foreground text-sm mt-8 text-center">Loading…</p>
        )}

        {!isLoading && data && data.skills.length > 0 && (
          <>
            <UnlockSummary achieved={achievedCount} total={data.skills.length} />
            {TIER_ORDER.map((tier) => (
              <TierSection
                key={tier}
                tier={tier}
                skills={data.skills.filter((s) => tierOf(s) === tier)}
                results={data.results}
                onTap={setSelectedId}
              />
            ))}
          </>
        )}

        {!isLoading && data && data.skills.length === 0 && (
          <p className="text-muted-foreground text-sm mt-8 text-center">
            No skills yet — seed data loads on next startup.
          </p>
        )}
      </div>

      {selectedSkill && selectedResult && (
        <DetailSheet
          skill={selectedSkill}
          result={selectedResult}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  )
}
