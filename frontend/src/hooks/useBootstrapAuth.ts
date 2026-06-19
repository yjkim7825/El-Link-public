import { useEffect } from 'react'
import { refresh } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { userFromToken } from '@/lib/jwt'

/**
 * 앱 최초 마운트 시 1회: refresh 쿠키로 access token 복구를 시도한다.
 * refresh 응답엔 user가 없으므로 토큰 클레임으로 최소 user(id/role)를 구성한다.
 * 성공/실패와 무관하게 bootstrapped=true 로 만들어 라우팅을 진행시킨다.
 */
export function useBootstrapAuth() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const setBootstrapped = useAuthStore((s) => s.setBootstrapped)

  useEffect(() => {
    let cancelled = false
    refresh()
      .then((res) => {
        if (cancelled) return
        setAuth(res.accessToken, userFromToken(res.accessToken))
      })
      .catch(() => {
        /* 미로그인 — 정상 경로 */
      })
      .finally(() => {
        if (!cancelled) setBootstrapped(true)
      })
    return () => {
      cancelled = true
    }
  }, [setAuth, setBootstrapped])
}
