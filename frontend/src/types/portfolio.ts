/** 파트너 포트폴리오 타입 (백엔드 com.ellink.material.dto, 파트너 전용 — 민감 필드 제외). */

/** 목록 항목(경량). MaterialListItem 미러 — fileKey/uploadedBy 없음. */
export interface PortfolioItem {
  id: number
  title: string
  summary: string
  category: string
  keywords: string | null
  fileCount: number
  createdAt: string
  /** 대표 이미지 API 경로(없으면 null). 인증 필요 → AuthImage(blob)로 렌더. */
  thumbnailUrl: string | null
}

/** 상세의 첨부 파일(fileKey 미노출 — 다운로드는 파일 id로). */
export interface PortfolioFile {
  id: number
  originalName: string
  mimeType: string | null
  size: number
}

/** 상세. uploadedBy/fileKey 등 관리자 전용 정보 없음. */
export interface PortfolioDetail {
  id: number
  title: string
  summary: string
  category: string
  keywords: string | null
  createdAt: string
  thumbnailUrl: string | null
  files: PortfolioFile[]
}

export interface PortfolioFilters {
  category?: string
  keyword?: string
}
