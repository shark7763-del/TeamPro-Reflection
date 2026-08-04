import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const variants: Record<Variant, string> = {
  primary: 'bg-team-navy text-white shadow-sm hover:bg-[#0d2949]',
  secondary: 'bg-white text-team-navy border border-slate-200 shadow-sm hover:border-team-blue',
  ghost: 'bg-transparent text-team-navy hover:bg-white/70',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700',
}

const base = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  full?: boolean
  children: ReactNode
}

export const Button = ({ variant = 'primary', full, className = '', children, ...props }: ButtonProps) => (
  <button className={`${base} ${variants[variant]} ${full ? 'w-full' : ''} ${className}`} {...props}>
    {children}
  </button>
)

interface ButtonLinkProps extends LinkProps {
  variant?: Variant
  full?: boolean
  children: ReactNode
}

export const ButtonLink = ({ variant = 'primary', full, className = '', children, ...props }: ButtonLinkProps) => (
  <Link className={`${base} ${variants[variant]} ${full ? 'w-full' : ''} ${className}`} {...props}>
    {children}
  </Link>
)
