import { create } from 'zustand'
import type { UserSummary } from '@/types/auth'

/**
 * 인증 전역 상태. persist 하지 않는다(메모리만) — 새로고침 시 /api/auth/refresh 로 복구.
 * accessToken 은 모듈 변수로도 미러링해, axios 인터셉터가 React 외부에서 즉시 읽도록 한다.
 */
interface AuthState {
  accessToken: string | null
  user: UserSummary | null
  mustChangePassword: boolean
  bootstrapped: boolean // 최초 refresh 복구 시도 완료 여부
  setAuth: (accessToken: string, user: UserSummary | null, mustChangePassword?: boolean) => void
  setToken: (accessToken: string) => void
  setUser: (user: UserSummary | null) => void
  setMustChangePassword: (v: boolean) => void
  clearAuth: () => void
  setBootstrapped: (v: boolean) => void
}

// React 렌더 사이클 밖(axios 인터셉터)에서 동기 접근하기 위한 미러.
let tokenRef: string | null = null
export function getAccessToken(): string | null {
  return tokenRef
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  mustChangePassword: false,
  bootstrapped: false,
  setAuth: (accessToken, user, mustChangePassword = false) => {
    tokenRef = accessToken
    set({ accessToken, user, mustChangePassword })
  },
  setToken: (accessToken) => {
    tokenRef = accessToken
    set({ accessToken })
  },
  setUser: (user) => set({ user }),
  setMustChangePassword: (v) => set({ mustChangePassword: v }),
  clearAuth: () => {
    tokenRef = null
    set({ accessToken: null, user: null, mustChangePassword: false })
  },
  setBootstrapped: (v) => set({ bootstrapped: v }),
}))
