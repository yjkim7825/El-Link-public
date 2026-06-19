import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { Role } from '@/types/auth'
import { useAuthStore } from '@/store/authStore'

interface ProtectedRouteProps {
  role: Role
  /** 파트너 영역에서 mustChangePassword 가드 적용 여부. */
  enforcePasswordChange?: boolean
}

/**
 * 보호 라우트. 미로그인 또는 역할 불일치 시 해당 로그인 페이지로 리다이렉트.
 * 파트너 + mustChangePassword 인 경우 비밀번호 변경 페이지로 강제 이동.
 */
export function ProtectedRoute({ role, enforcePasswordChange }: ProtectedRouteProps) {
  const location = useLocation()
  const { accessToken, user, mustChangePassword } = useAuthStore()

  const loginPath = role === 'ADMIN' ? '/admin/login' : '/partner/login'

  if (!accessToken || user?.role !== role) {
    return <Navigate to={loginPath} replace state={{ from: location.pathname }} />
  }

  if (
    enforcePasswordChange &&
    mustChangePassword &&
    location.pathname !== '/partner/change-password'
  ) {
    return <Navigate to="/partner/change-password" replace />
  }

  return <Outlet />
}
