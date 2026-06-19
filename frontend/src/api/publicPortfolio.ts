import { api } from './client'
import type { ApiResponse } from '@/types/api'
import type { PortfolioItem } from '@/types/portfolio'

/** 무인증 협업 사례 목록(랜딩 미리보기용). 파트너 목록과 동일 DTO(sanitized). */
export async function listPublicPortfolio(): Promise<PortfolioItem[]> {
  const res = await api.get<ApiResponse<PortfolioItem[]>>('/public/portfolio')
  return res.data.data
}

/** 무인증 대표 이미지 경로(<img src>로 직접 사용, 토큰 불필요). 없으면 404 → 폴백. */
export function publicThumbnailUrl(id: number): string {
  return `/api/public/portfolio/${id}/thumbnail`
}
