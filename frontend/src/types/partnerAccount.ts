/** 파트너 내 계정 타입 (백엔드 PartnerMeResponse 미러). */
import type { PartnerStatus } from './partner'

export type { ChangePasswordRequest } from './auth'

export interface PartnerMe {
  id: number
  email: string
  companyName: string
  contactName: string
  phone: string | null
  status: PartnerStatus
  lastLoginAt: string | null
  createdAt: string
}
