import { Button } from '@/components/ui/button'
import { formatTime } from '@/lib/utils'
import { SkipForward } from 'lucide-react'

interface RestScreenProps {
  remaining: number
  total: number
  onSkip: () => void
}

export function RestScreen({ remaining, total, onSkip }: RestScreenProps) {
  const elapsed = total - remaining
  const circumference = 2 * Math.PI * 72
  const strokeDashoffset = circumference * (1 - elapsed / total)

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
      <p className="text-lg font-semibold text-muted-foreground">Rest</p>

      <div className="relative h-48 w-48">
        <svg className="h-48 w-48 -rotate-90" viewBox="0 0 160 160">
          <circle
            cx="80"
            cy="80"
            r="72"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-secondary"
          />
          <circle
            cx="80"
            cy="80"
            r="72"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="text-primary transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl font-bold font-mono tabular-nums">
            {formatTime(remaining)}
          </span>
        </div>
      </div>

      <Button variant="outline" size="lg" onClick={onSkip}>
        <SkipForward className="h-5 w-5 mr-2" />
        Skip Rest
      </Button>
    </div>
  )
}
