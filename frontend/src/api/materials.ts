import { api } from './client'
import type { ApiResponse } from '@/types/api'
import type {
  MaterialAnalyzeResponse,
  MaterialCreateRequest,
  MaterialDetail,
  MaterialListFilters,
  MaterialListItem,
} from '@/types/material'

/** 파일/텍스트(+대표 이미지) → Gemini 분석(multipart, DB 저장 없음). */
export async function analyzeMaterial(input: {
  file?: File | null
  text?: string
  representativeImage?: File | null
}): Promise<MaterialAnalyzeResponse> {
  const form = new FormData()
  if (input.file) form.append('file', input.file)
  if (input.text && input.text.trim()) form.append('text', input.text)
  if (input.representativeImage) form.append('representativeImage', input.representativeImage)
  const res = await api.post<ApiResponse<MaterialAnalyzeResponse>>('/admin/materials/analyze', form)
  return res.data.data
}

/** 분석 결과 확정 저장. */
export async function createMaterial(req: MaterialCreateRequest): Promise<MaterialDetail> {
  const res = await api.post<ApiResponse<MaterialDetail>>('/admin/materials', req)
  return res.data.data
}

/** 목록(카테고리·키워드 필터). */
export async function listMaterials(filters: MaterialListFilters): Promise<MaterialListItem[]> {
  const res = await api.get<ApiResponse<MaterialListItem[]>>('/admin/materials', {
    params: {
      category: filters.category || undefined,
      keyword: filters.keyword || undefined,
    },
  })
  return res.data.data
}

export async function getMaterial(id: number): Promise<MaterialDetail> {
  const res = await api.get<ApiResponse<MaterialDetail>>(`/admin/materials/${id}`)
  return res.data.data
}

export async function deleteMaterial(id: number): Promise<void> {
  await api.delete(`/admin/materials/${id}`)
}

/**
 * 첨부 원본 파일 다운로드. 토큰이 메모리에만 있어 일반 <a> 링크로는 인증이 안 되므로,
 * axios(인터셉터가 Bearer 첨부)로 blob을 받아 임시 object URL로 내려받는다.
 */
export async function downloadMaterialFile(
  materialId: number,
  fileId: number,
  fileName: string,
): Promise<void> {
  const res = await api.get(`/admin/materials/${materialId}/files/${fileId}/download`, {
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
