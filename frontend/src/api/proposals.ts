import { api } from './client'
import type { ApiResponse } from '@/types/api'
import type {
  ProposalAnalysis,
  ProposalCreateRequest,
  ProposalDetail,
  ProposalListItem,
} from '@/types/proposal'

/** 기업명 → 2단계 Gemini 분석(기업 조사 + 아이디어 3개). DB 저장 없음, 10~15초 소요. */
export async function analyzeProposal(input: { companyName: string }): Promise<ProposalAnalysis> {
  const res = await api.post<ApiResponse<ProposalAnalysis>>('/admin/proposals/analyze', {
    companyName: input.companyName,
  })
  return res.data.data
}

/** 분석 결과 확정 저장. */
export async function createProposal(req: ProposalCreateRequest): Promise<ProposalDetail> {
  const res = await api.post<ApiResponse<ProposalDetail>>('/admin/proposals', req)
  return res.data.data
}

/** 목록. */
export async function listProposals(): Promise<ProposalListItem[]> {
  const res = await api.get<ApiResponse<ProposalListItem[]>>('/admin/proposals')
  return res.data.data
}

/** 단건 상세(아이디어 + 관련 자료 포함). */
export async function getProposal(id: number): Promise<ProposalDetail> {
  const res = await api.get<ApiResponse<ProposalDetail>>(`/admin/proposals/${id}`)
  return res.data.data
}

export async function deleteProposal(id: number): Promise<void> {
  await api.delete(`/admin/proposals/${id}`)
}
