import { api } from './client'
import type { ApiResponse } from '@/types/api'
import type { PartnerMe } from '@/types/partnerAccount'

/** 내 정보 조회. */
export async function getMyInfo(): Promise<PartnerMe> {
  const res = await api.get<ApiResponse<PartnerMe>>('/partner/me')
  return res.data.data
}

// 비밀번호 변경은 기존 auth API(changePartnerPassword)를 재사용한다.
export { changePartnerPassword } from './auth'
