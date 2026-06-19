import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { useAuthStore } from '@/store/authStore'
import { logout as apiLogout } from '@/api/auth'

interface NavItem {
  to: string
  label: string
}

interface AppLayoutProps {
  scopeLabel: string // "관리자" | "파트너"
  nav: readonly NavItem[]
  loginPath: string
}

/** 관리자/파트너 공용 셸: 좌측 사이드바 + 상단 헤더 + 본문 Outlet. */
export function AppLayout({ scopeLabel, nav, loginPath }: AppLayoutProps) {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)

  const displayName =
    user?.name ?? user?.companyName ?? (user ? `#${user.id}` : '')

  async function handleLogout() {
    try {
      await apiLogout()
    } finally {
      clearAuth()
      navigate(loginPath, { replace: true })
    }
  }

  return (
    <div className="flex min-h-full">
      {/* legacy 패턴 B 사이드바: 260px 블루 + 흰 로고/내비 */}
      <aside className="flex w-64 shrink-0 flex-col bg-brand-500 text-white">
        <div className="flex flex-col items-center gap-2 border-b border-white/20 px-6 py-6">
          <Logo className="w-36" />
          <span className="text-sm font-bold text-white/90">{scopeLabel}</span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'block rounded-lg px-5 py-3 text-[15px] font-medium transition-colors',
                  isActive
                    ? 'bg-white/20 font-bold text-white'
                    : 'text-white/85 hover:bg-white/10 hover:text-white',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col bg-ink-50">
        <header className="flex h-16 items-center justify-between border-b border-ink-200 bg-white px-6">
          <div className="text-sm text-ink-500">{scopeLabel} 콘솔</div>
          <div className="flex items-center gap-3">
            {displayName && <span className="text-sm text-ink-700">{displayName}</span>}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              로그아웃
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-screen-2xl px-6 py-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
