/** 백엔드 partner DTO 미러 (com.ellink.partner.dto). */

/** 파트너 계정 상태. INVITED(등록됨·최초 로그인 전) → ACTIVE ↔ DISABLED(비활성). */
export type PartnerStatus = 'INVITED' | 'ACTIVE' | 'DISABLED'

/** 관리자 화면용 파트너 요약(목록/상태변경 응답). */
export interface PartnerSummary {
  id: number
  email: string
  companyName: string
  contactName: string
  phone: string | null
  status: PartnerStatus
  mustChangePassword: boolean
  lastLoginAt: string | null
  createdAt: string
}

/** 파트너 등록 요청(비밀번호는 서버가 임시 발급). */
export interface CreatePartnerRequest {
  email: string
  companyName: string
  contactName: string
  phone?: string | null
}

/** 등록 결과 — temporaryPassword는 이 응답에서 1회만 노출된다. */
export interface CreatePartnerResponse {
  id: number
  email: string
  companyName: string
  temporaryPassword: string
}

export interface PartnerListFilters {
  status?: PartnerStatus | ''
  keyword?: string
}
