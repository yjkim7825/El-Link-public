import { api } from './client'
import type { ApiResponse } from '@/types/api'
import type {
  ChangePasswordRequest,
  LoginRequest,
  LoginResponse,
  RefreshResponse,
} from '@/types/auth'

export async function adminLogin(req: LoginRequest): Promise<LoginResponse> {
  const res = await api.post<ApiResponse<LoginResponse>>('/admin/auth/login', req)
  return res.data.data
}

export async function partnerLogin(req: LoginRequest): Promise<LoginResponse> {
  const res = await api.post<ApiResponse<LoginResponse>>('/partner/auth/login', req)
  return res.data.data
}

export async function refresh(): Promise<RefreshResponse> {
  const res = await api.post<ApiResponse<RefreshResponse>>('/auth/refresh', null)
  return res.data.data
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout', null)
}

export async function changePartnerPassword(req: ChangePasswordRequest): Promise<void> {
  await api.post('/partner/auth/change-password', req)
}
