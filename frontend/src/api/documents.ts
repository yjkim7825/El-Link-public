import { api } from './client'
import type { ApiResponse } from '@/types/api'
import type {
  CompanyDocType,
  DocumentIssueFilters,
  DocumentIssueItem,
  DocumentItem,
  UpdateDocumentRequest,
} from '@/types/document'

/**
 * 문서 전체(비활성 포함). 백엔드는 서버사이드 필터를 제공하지 않으므로
 * 종류/비활성 필터는 호출부(useDocuments)에서 클라이언트사이드로 적용한다.
 */
export async function listDocuments(): Promise<DocumentItem[]> {
  const res = await api.get<ApiResponse<DocumentItem[]>>('/admin/documents')
  return res.data.data
}

/** 업로드(multipart). onProgress로 진행률(0~100) 콜백. */
export async function createDocument(
  input: { type: CompanyDocType; title: string; file: File },
  onProgress?: (percent: number) => void,
): Promise<DocumentItem> {
  const form = new FormData()
  form.append('type', input.type)
  form.append('title', input.title)
  form.append('file', input.file)
  const res = await api.post<ApiResponse<DocumentItem>>('/admin/documents', form, {
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100))
    },
  })
  return res.data.data
}

/** 제목/활성여부 수정(PATCH). */
export async function updateDocument(
  id: number,
  req: UpdateDocumentRequest,
): Promise<DocumentItem> {
  const res = await api.patch<ApiResponse<DocumentItem>>(`/admin/documents/${id}`, req)
  return res.data.data
}

/** soft delete(isActive=false). */
export async function deleteDocument(id: number): Promise<void> {
  await api.delete(`/admin/documents/${id}`)
}

/** 발급 이력(파트너/기간 필터). */
export async function listIssues(filters: DocumentIssueFilters): Promise<DocumentIssueItem[]> {
  const res = await api.get<ApiResponse<DocumentIssueItem[]>>('/admin/documents/issues', {
    params: {
      partnerId: filters.partnerId || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
    },
  })
  return res.data.data
}

/**
 * 관리자 다운로드. 토큰이 메모리에만 있어 <a> 링크로는 인증 불가 →
 * axios(인터셉터 Bearer)로 blob을 받아 임시 object URL로 내려받는다. (이력 미기록)
 */
export async function downloadDocument(id: number, fileName: string): Promise<void> {
  const res = await api.get(`/admin/documents/${id}/download`, { responseType: 'blob' })
  const url = URL.createObjectURL(res.data as Blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
