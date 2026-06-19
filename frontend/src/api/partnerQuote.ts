import { api } from './client'
import type { ApiResponse } from '@/types/api'
import type {
  ActiveCatalogItem,
  MyQuoteDetail,
  MyQuoteListItem,
  QuoteCreateRequest,
} from '@/types/partnerQuote'

/** 활성 카탈로그(파트너용). */
export async function listActiveCatalog(): Promise<ActiveCatalogItem[]> {
  const res = await api.get<ApiResponse<ActiveCatalogItem[]>>('/partner/catalog')
  return res.data.data
}

/** 견적 생성(항상 DRAFT). 서버가 단가 스냅샷 + 총액 재계산. */
export async function createQuote(req: QuoteCreateRequest): Promise<MyQuoteDetail> {
  const res = await api.post<ApiResponse<MyQuoteDetail>>('/partner/quotes', req)
  return res.data.data
}

export async function listMyQuotes(): Promise<MyQuoteListItem[]> {
  const res = await api.get<ApiResponse<MyQuoteListItem[]>>('/partner/quotes')
  return res.data.data
}

export async function getMyQuote(id: number): Promise<MyQuoteDetail> {
  const res = await api.get<ApiResponse<MyQuoteDetail>>(`/partner/quotes/${id}`)
  return res.data.data
}

/** 발급(DRAFT→ISSUED). 응답은 생성된 PDF 바이트(blob). */
export async function issueQuote(id: number): Promise<Blob> {
  const res = await api.post(`/partner/quotes/${id}/issue`, null, { responseType: 'blob' })
  return res.data as Blob
}

/** 발급된 견적서 PDF 다운로드(blob). */
export async function fetchQuotePdf(id: number): Promise<Blob> {
  const res = await api.get(`/partner/quotes/${id}/pdf`, { responseType: 'blob' })
  return res.data as Blob
}

/** Blob을 파일로 내려받기(임시 object URL). */
export function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** 견적 PDF 다운로드(받아서 저장). */
export async function downloadQuotePdf(id: number): Promise<void> {
  const blob = await fetchQuotePdf(id)
  saveBlob(blob, `quote-${id}.pdf`)
}
