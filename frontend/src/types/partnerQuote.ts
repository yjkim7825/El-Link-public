/** 파트너 모의 견적 타입 (백엔드 com.ellink.quote.dto 미러). */
import type { CatalogItem } from './catalog'

export type QuoteStatus = 'DRAFT' | 'ISSUED'

/** 활성 카탈로그 항목 — CatalogResponse 그대로(파트너는 활성만 받음). */
export type ActiveCatalogItem = CatalogItem

/**
 * 견적 작성 폼의 라인(클라이언트 로컬 모델).
 * - 카탈로그 FIXED: catalogId 있음, 단가 고정(priceEditable=false)
 * - 카탈로그 CUSTOM: catalogId 있음, 단가 입력(priceEditable=true)
 * - 커스텀(기타 항목): catalogId 없음, 품명·단가 입력(nameEditable=true)
 */
export interface QuoteLine {
  key: string
  catalogId: number | null
  itemName: string
  unitPrice: number
  quantity: number
  days: number
  priceEditable: boolean
  nameEditable: boolean
}

/** create 요청 라인. */
export interface QuoteItemPayload {
  catalogId?: number | null
  itemName?: string
  unitPrice?: number
  quantity: number
  days: number
}

/** create 요청. */
export interface QuoteCreateRequest {
  clientCompanyName?: string | null
  items: QuoteItemPayload[]
}

/** 목록 항목. */
export interface MyQuoteListItem {
  id: number
  clientCompanyName: string | null
  totalAmount: number
  status: QuoteStatus
  itemCount: number
  createdAt: string
  issuedAt: string | null
}

/** 상세의 품목. */
export interface QuoteItemInfo {
  id: number
  catalogId: number | null
  itemName: string
  unitPrice: number
  quantity: number
  days: number
  subtotal: number
  orderIndex: number
}

/** 단건 상세. 금액 분해(라인합/기업이윤/공급가액/VAT/합계) + 발주처 + 유효기간 포함. */
export interface MyQuoteDetail {
  id: number
  partnerId: number
  partnerCompanyName: string
  clientCompanyName: string | null
  subtotalSum: number
  companyProfit: number
  supplyAmount: number
  vat: number
  totalAmount: number
  status: QuoteStatus
  createdAt: string
  issuedAt: string | null
  validUntil: string | null
  items: QuoteItemInfo[]
}
