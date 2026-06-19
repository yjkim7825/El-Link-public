/** 백엔드 document DTO 미러 (com.ellink.document). */

/** 고정 회사 서류 종류. */
export type CompanyDocType = 'BUSINESS_LICENSE' | 'BANK_ACCOUNT' | 'INTRO_DECK' | 'ETC'

export const DOC_TYPES: { value: CompanyDocType; label: string }[] = [
  { value: 'BUSINESS_LICENSE', label: '사업자등록증' },
  { value: 'BANK_ACCOUNT', label: '통장사본' },
  { value: 'INTRO_DECK', label: '회사소개서' },
  { value: 'ETC', label: '기타' },
]

const DOC_TYPE_LABELS: Record<CompanyDocType, string> = Object.fromEntries(
  DOC_TYPES.map((t) => [t.value, t.label]),
) as Record<CompanyDocType, string>

export function docTypeLabel(t: CompanyDocType): string {
  return DOC_TYPE_LABELS[t] ?? t
}

/** 관리자용 문서 응답(fileKey는 노출 안 됨). */
export interface DocumentItem {
  id: number
  type: CompanyDocType
  title: string
  originalName: string
  mimeType: string | null
  size: number
  isActive: boolean
  uploadedByName: string
  updatedAt: string
}

/** PATCH 부분 수정 — title/isActive만. */
export interface UpdateDocumentRequest {
  title?: string
  isActive?: boolean
}

/** 발급 이력 항목. */
export interface DocumentIssueItem {
  id: number
  documentId: number
  documentTitle: string
  documentType: CompanyDocType
  partnerId: number
  partnerCompanyName: string
  partnerContactName: string
  issuedAt: string
}

export interface DocumentListFilters {
  type?: CompanyDocType | ''
  includeInactive?: boolean
}

export interface DocumentIssueFilters {
  partnerId?: number | ''
  /** ISO-8601 instant (예: 2026-06-01T00:00:00Z). */
  from?: string
  to?: string
}
