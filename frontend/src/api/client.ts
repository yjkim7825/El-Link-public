import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import type { ApiResponse, ApiError } from '@/types/api'
import type { RefreshResponse } from '@/types/auth'
import { getAccessToken, useAuthStore } from '@/store/authStore'
import { userFromToken } from '@/lib/jwt'

/**
 * API 베이스 URL.
 * - dev/동일도메인: VITE_API_BASE_URL 미설정 → '/api' (Vite 프록시 또는 같은 출처).
 * - 분리 배포(Vercel↔Railway): VITE_API_BASE_URL='https://<backend>' → '<backend>/api'.
 */
const RAW_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
export const API_BASE_URL = RAW_BASE ? `${RAW_BASE}/api` : '/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // refresh httpOnly 쿠키 송수신
})

// 요청 인터셉터: access token 자동 첨부.
api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// --- 401 → refresh 후 1회 재시도 (동시 401은 단일 refresh로 합류) ---
let refreshing: Promise<string | null> | null = null

/** refresh 전용 호출(인터셉터 미적용 raw axios)로 무한루프 방지. */
async function requestRefresh(): Promise<string | null> {
  try {
    const res = await axios.post<ApiResponse<RefreshResponse>>(
      `${API_BASE_URL}/auth/refresh`,
      null,
      { withCredentials: true },
    )
    const token = res.data?.data?.accessToken ?? null
    if (token) {
      useAuthStore.getState().setAuth(token, userFromToken(token))
    }
    return token
  } catch {
    useAuthStore.getState().clearAuth()
    return null
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const original = error.config as (AxiosRequestConfig & { _retried?: boolean }) | undefined
    const status = error.response?.status
    const url = original?.url ?? ''

    // refresh/login 자체의 401은 재시도 대상 아님.
    const isAuthEndpoint = url.includes('/auth/refresh') || url.includes('/auth/login')

    if (status === 401 && original && !original._retried && !isAuthEndpoint) {
      original._retried = true
      refreshing = refreshing ?? requestRefresh().finally(() => (refreshing = null))
      const token = await refreshing
      if (token) {
        original.headers = { ...original.headers, Authorization: `Bearer ${token}` }
        return api(original)
      }
    }
    return Promise.reject(error)
  },
)

/** AxiosError → 백엔드 ApiError 추출(없으면 일반 메시지). */
export function toApiError(err: unknown): ApiError {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as ApiResponse<unknown> | undefined
    if (body?.error) return body.error
    return { code: 'NETWORK_ERROR', message: err.message }
  }
  return { code: 'UNKNOWN', message: '알 수 없는 오류가 발생했습니다.' }
}
