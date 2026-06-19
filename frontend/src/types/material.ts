/** 백엔드 material DTO 미러 (com.ellink.material.dto). */

/** Gemini 분류 결과. */
export interface MaterialAnalysis {
  category: string | null
  title: string | null
  introduction: string | null
  partnerCompany: string | null
  keywords: string | null
}

/** analyze 단계에서 저장된 파일 메타(확정 저장 시 그대로 돌려보냄). */
export interface MaterialFileRef {
  fileKey: string
  originalName: string
  mimeType?: string | null
  size: number
}

export interface MaterialAnalyzeResponse {
  analysis: MaterialAnalysis
  file: MaterialFileRef | null
  /** 대표 이미지(있을 때). 저장 시 thumbnailFileKey로 전달. */
  thumbnail: MaterialFileRef | null
}

/** 목록 항목(경량). */
export interface MaterialListItem {
  id: number
  title: string
  summary: string
  category: string
  keywords: string | null
  fileCount: number
  createdAt: string
}

export interface MaterialFileInfo {
  id: number
  fileKey: string
  originalName: string
  mimeType?: string | null
  size: number
  uploadedAt: string
}

/** 단건 상세. */
export interface MaterialDetail {
  id: number
  title: string
  summary: string
  category: string
  keywords: string | null
  uploadedByName: string
  createdAt: string
  thumbnailUrl: string | null
  files: MaterialFileInfo[]
}

export interface MaterialCreateRequest {
  title: string
  summary: string
  category: string
  keywords?: string | null
  thumbnailFileKey?: string | null
  files?: MaterialFileRef[]
}

export interface MaterialListFilters {
  category?: string
  keyword?: string
}

/** legacy CLASSIFY_PROMPT 고정 카테고리. */
export const MATERIAL_CATEGORIES = ['환경 교육', '체험', '봉사', '업사이클링'] as const
