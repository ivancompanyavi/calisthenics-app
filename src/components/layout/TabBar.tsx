import { NavLink } from 'react-router-dom'
import { Home, Clock, Dumbbell, CalendarDays, Library, Map, Utensils } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/history', icon: Clock, label: 'History' },
  { to: '/workouts', icon: Dumbbell, label: 'Workouts' },
  { to: '/programs', icon: CalendarDays, label: 'Programs' },
  { to: '/nutrition', icon: Utensils, label: 'Nutrition' },
  { to: '/library', icon: Library, label: 'Library' },
  { to: '/atlas', icon: Map, label: 'Atlas' },
] as const

export function TabBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 backdrop-blur-md safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-0.5">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 px-1.5 py-2 rounded-lg transition-colors touch-manipulation min-w-0 flex-1',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="text-[10px] font-medium leading-none truncate max-w-full">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
