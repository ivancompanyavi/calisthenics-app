import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  children?: ReactNode
  className?: string
}

export function PageHeader({ title, children, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between px-4 pt-4 pb-2 safe-top', className)}>
      <h1 className="text-2xl font-bold">{title}</h1>
      {children}
    </div>
  )
}
