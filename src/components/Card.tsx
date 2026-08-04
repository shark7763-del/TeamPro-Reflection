import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export const Card = ({ className = '', children, ...props }: CardProps) => (
  <div className={`rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5 ${className}`} {...props}>
    {children}
  </div>
)
