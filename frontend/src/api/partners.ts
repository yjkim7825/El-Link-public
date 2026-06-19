import { api } from './client'
import type { ApiResponse } from '@/types/api'
import type {
  CreatePartnerRequest,
  CreatePartnerResponse,
  PartnerStatus,
  PartnerSummary,
} from '@/types/partner'

/**
 * 파트너 목록. 백엔드는 서버사이드 필터를 제공하지 않으므로(전체를 createdAt DESC로 반환)
 * 상태/키워드 필터는 호출부(usePartners)에서 클라이언트사이드로 적용한다.
 */
export async function listPartners(): Promise<PartnerSummary[]> {
  const res = await api.get<ApiResponse<PartnerSummary[]>>('/admin/partners')
  return res.data.data
}

/** 파트너 등록. 응답의 temporaryPassword는 1회만 노출됨. */
export async function createPartner(req: CreatePartnerRequest): Promise<CreatePartnerResponse> {
  const res = await api.post<ApiResponse<CreatePartnerResponse>>('/admin/partners', req)
  return res.data.data
}

/** 활성/비활성 전환(ACTIVE | DISABLED). INVITED로는 변경 불가. */
export async function updatePartnerStatus(
  id: number,
  status: Extract<PartnerStatus, 'ACTIVE' | 'DISABLED'>,
): Promise<PartnerSummary> {
  const res = await api.patch<ApiResponse<PartnerSummary>>(`/admin/partners/${id}/status`, { status })
  return res.data.data
}
