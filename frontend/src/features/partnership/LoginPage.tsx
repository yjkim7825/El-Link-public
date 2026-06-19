import { useNavigate } from 'react-router-dom'
import { LoginCard } from '@/components/auth/LoginCard'
import { partnerLogin } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'

export function PartnerLoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  return (
    <LoginCard
      title="파트너십"
      subtitle="CSR 담당자 전용"
      loginFn={partnerLogin}
      onSuccess={(res) => {
        setAuth(res.accessToken, res.user, res.mustChangePassword)
        navigate(res.mustChangePassword ? '/partner/change-password' : '/partner', {
          replace: true,
        })
      }}
      switchHref="/admin/login"
      switchLabel="관리자 로그인으로 →"
      hint="최초 로그인 시 비밀번호 변경이 필요합니다."
    />
  )
}
