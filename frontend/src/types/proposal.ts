/** 백엔드 proposal DTO 미러 (com.ellink.proposal.dto). */

/** 아이디어 입출력 공통 형태(analyze 응답 / create 요청). */
export interface ProposalIdeaPayload {
  title: string
  description: string
  relatedMaterialIds: number[]
}

/** 2단계 Gemini 분석 결과(DB 저장 전). */
export interface ProposalAnalysis {
  companyName: string
  companyAnalysis: string
  ideas: ProposalIdeaPayload[]
}

/** 상세 응답의 관련 자료 참조(삭제된 자료는 제외되어 내려옴). */
export interface ProposalMaterialRef {
  id: number
  title: string
}

/** 상세 응답의 아이디어(저장 후 id/orderIndex 포함, 관련 자료 제목 해석됨). */
export interface ProposalIdea {
  id: number
  title: string
  description: string
  relatedMaterialIds: number[]
  relatedMaterials: ProposalMaterialRef[]
  orderIndex: number
}

/** 협업 제안 단건 상세. */
export interface ProposalDetail {
  id: number
  targetCompanyName: string
  companyAnalysis: string
  createdByName: string
  createdAt: string
  ideas: ProposalIdea[]
}

/** 목록 항목(경량). */
export interface ProposalListItem {
  id: number
  targetCompanyName: string
  ideaCount: number
  createdAt: string
}

/** 확정 저장 요청. */
export interface ProposalCreateRequest {
  targetCompanyName: string
  companyAnalysis: string
  ideas: ProposalIdeaPayload[]
}
