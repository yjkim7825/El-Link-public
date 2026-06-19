import { api } from './client'
import type { ApiResponse } from '@/types/api'
import type { PartnerDocumentGroup } from '@/types/partnerDocument'

/** 파트너용 서류 목록(type별 그룹, 활성 문서만). */
export async function listPartnerDocuments(): Promise<PartnerDocumentGroup[]> {
  const res = await api.get<ApiResponse<PartnerDocumentGroup[]>>('/partner/documents')
  return res.data.data
}

/**
 * 서류 다운로드. 백엔드가 발급 이력(DocumentIssue)을 자동 기록한다.
 * 토큰이 메모리에만 있어 axios blob으로 받아 임시 object URL로 내려받는다.
 */
export async function downloadPartnerDocument(id: number, fileName: string): Promise<void> {
  const res = await api.get(`/partner/documents/${id}/download`, { responseType: 'blob' })
  const url = URL.createObjectURL(res.data as Blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
