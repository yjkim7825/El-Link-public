import { useNavigate } from 'react-router-dom'
import { LoginCard } from '@/components/auth/LoginCard'
import { adminLogin } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  return (
    <LoginCard
      title="관리자"
      subtitle="EcoLink 운영 콘솔"
      loginFn={adminLogin}
      onSuccess={(res) => {
        setAuth(res.accessToken, res.user, res.mustChangePassword)
        navigate('/admin', { replace: true })
      }}
      switchHref="/partner/login"
      switchLabel="파트너 로그인으로 →"
      hint="개발 시드: admin@ecolink.demo / admin1234"
    />
  )
}
