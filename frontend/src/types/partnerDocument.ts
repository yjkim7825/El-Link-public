/** 파트너 서류 발급 타입 (백엔드 PartnerDocumentGroup 미러, 민감 필드 제외). */
import type { CompanyDocType } from './document'

export type { CompanyDocType }

/** 그룹 내 문서 항목(fileKey/uploadedBy 미노출). */
export interface PartnerDocumentItem {
  id: number
  title: string
  originalName: string
  mimeType: string | null
  size: number
}

/** type별 그룹. */
export interface PartnerDocumentGroup {
  type: CompanyDocType
  documents: PartnerDocumentItem[]
}
