import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
}

export const EmptyState = ({ title, description, action }: EmptyStateProps) => (
  <div className="rounded-lg border border-dashed border-slate-300 bg-white/70 p-6 text-center">
    <p className="font-semibold text-team-ink">{title}</p>
    {description && <p className="mt-2 text-sm leading-6 text-team-muted">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
)
