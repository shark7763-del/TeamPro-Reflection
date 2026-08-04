import { Activity, Home, ShieldCheck, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'

const navItems = [
  { to: '/', label: '首頁', icon: Home },
  { to: '/students/reflect', label: '反思', icon: Activity },
  { to: '/students/records', label: '紀錄', icon: ShieldCheck },
  { to: '/coach', label: '教練', icon: Users },
]

export const AppLayout = ({ children }: { children: ReactNode }) => (
  <LayoutContent>{children}</LayoutContent>
)

const LayoutContent = ({ children }: { children: ReactNode }) => {
  const location = useLocation()
  const studentMode =
    location.pathname.startsWith('/students') ||
    location.pathname.startsWith('/role') ||
    location.pathname.startsWith('/reflect') ||
    location.pathname.startsWith('/result') ||
    location.pathname.startsWith('/complete') ||
    location.pathname.startsWith('/records')
  const visibleNavItems = studentMode ? navItems.filter((item) => item.to !== '/coach') : navItems

  return (
    <div className="min-h-screen">
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/92 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-team-navy text-white">
            <ShieldCheck size={23} />
          </div>
          <div className="leading-tight">
            <div className="text-lg font-black text-team-navy">TeamPro</div>
            <div className="text-xs font-semibold text-team-muted">團隊反思系統</div>
          </div>
        </Link>
        <nav className="hidden items-center gap-1 sm:flex">
          {visibleNavItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition ${
                    isActive ? 'bg-team-navy text-white' : 'text-team-muted hover:bg-slate-100 hover:text-team-navy'
                  }`
                }
              >
                <Icon size={17} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>
      </div>
    </header>

    <main className="mx-auto max-w-6xl px-4 py-5 pb-24 sm:py-8">{children}</main>

    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white sm:hidden">
      <div className={visibleNavItems.length === 3 ? 'grid grid-cols-3' : 'grid grid-cols-4'}>
        {visibleNavItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold ${
                  isActive ? 'text-team-navy' : 'text-team-muted'
                }`
              }
            >
              <Icon size={20} />
              {item.label}
            </NavLink>
          )
        })}
      </div>
    </nav>
    </div>
  )
}
