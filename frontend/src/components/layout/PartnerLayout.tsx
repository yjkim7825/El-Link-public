import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { Logo } from '@/components/ui/Logo'
import { useAuthStore } from '@/store/authStore'
import { logout as apiLogout } from '@/api/auth'
import { PARTNER_NAV } from '@/lib/constants'

/**
 * 파트너 사이트 셸 — legacy 패턴 A. 브랜드 블루 배경 + 상단 바(로고·내비·로그아웃),
 * 본문은 중앙 정렬 컨테이너에 흰 카드가 떠 있는 형태. 관리자(패턴 B 사이드바)와 명확히 구분.
 */
export function PartnerLayout() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)

  const displayName = user?.companyName ?? user?.name ?? (user ? `#${user.id}` : '')

  async function handleLogout() {
    try {
      await apiLogout()
    } finally {
      clearAuth()
      navigate('/partner/login', { replace: true })
    }
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-brand-500 to-brand-700">
      {/* 상단 바 */}
      <header className="sticky top-0 z-30 border-b border-white/15 bg-brand-600/40 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Logo className="w-28" />
            <nav className="hidden items-center gap-1 sm:flex">
              {PARTNER_NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-white/20 font-semibold text-white'
                        : 'text-white/80 hover:bg-white/10 hover:text-white',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {displayName && <span className="hidden text-sm text-white/90 sm:inline">{displayName}</span>}
            <button
              onClick={handleLogout}
              className="rounded-lg px-3 py-2 text-sm font-medium text-white/85 hover:bg-white/10 hover:text-white"
            >
              로그아웃
            </button>
          </div>
        </div>
        {/* 모바일 내비 */}
        <nav className="flex items-center gap-1 overflow-x-auto px-4 pb-2 sm:hidden">
          {PARTNER_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium',
                  isActive ? 'bg-white/20 text-white' : 'text-white/80',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}
