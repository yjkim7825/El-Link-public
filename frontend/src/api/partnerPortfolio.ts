import { api } from './client'
import type { ApiResponse } from '@/types/api'
import type { PortfolioDetail, PortfolioFilters, PortfolioItem } from '@/types/portfolio'

/** 포트폴리오 목록(카테고리/키워드 필터). 서버사이드 필터 지원. */
export async function listPortfolio(filters: PortfolioFilters): Promise<PortfolioItem[]> {
  const res = await api.get<ApiResponse<PortfolioItem[]>>('/partner/portfolio', {
    params: {
      category: filters.category || undefined,
      keyword: filters.keyword || undefined,
    },
  })
  return res.data.data
}

export async function getPortfolioItem(id: number): Promise<PortfolioDetail> {
  const res = await api.get<ApiResponse<PortfolioDetail>>(`/partner/portfolio/${id}`)
  return res.data.data
}

/** 첨부 파일 다운로드. 토큰이 메모리에만 있어 axios blob으로 받아 내려받는다. */
export async function downloadPortfolioFile(
  materialId: number,
  fileId: number,
  fileName: string,
): Promise<void> {
  const res = await api.get(`/partner/portfolio/${materialId}/files/${fileId}/download`, {
    responseType: 'blob',
  })
  const url = URL.createObjectURL(res.data as Blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
