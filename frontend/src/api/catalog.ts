import { api } from './client'
import type { ApiResponse } from '@/types/api'
import type { CatalogCreateRequest, CatalogItem, CatalogUpdateRequest } from '@/types/catalog'

/**
 * 카탈로그 전체(비활성 포함). 백엔드가 서버사이드 필터를 제공하지 않으므로
 * 카테고리/비활성 필터는 호출부(useCatalog)에서 클라이언트사이드로 적용한다.
 */
export async function listCatalog(): Promise<CatalogItem[]> {
  const res = await api.get<ApiResponse<CatalogItem[]>>('/admin/catalog')
  return res.data.data
}

export async function createCatalog(req: CatalogCreateRequest): Promise<CatalogItem> {
  const res = await api.post<ApiResponse<CatalogItem>>('/admin/catalog', req)
  return res.data.data
}

export async function updateCatalog(id: number, req: CatalogUpdateRequest): Promise<CatalogItem> {
  const res = await api.patch<ApiResponse<CatalogItem>>(`/admin/catalog/${id}`, req)
  return res.data.data
}

/** soft delete(isActive=false). */
export async function deleteCatalog(id: number): Promise<void> {
  await api.delete(`/admin/catalog/${id}`)
}
