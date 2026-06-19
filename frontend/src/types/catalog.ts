/** 백엔드 catalog DTO 미러 (com.ellink.quote.dto / enum). */

/** 견적 카탈로그 분류. */
export type QuoteCategory = 'PLANNING' | 'VOLUNTEER' | 'EXPERIENCE' | 'SOUVENIR' | 'OPERATIONS'

/** 단가 유형. FIXED(고정 단가), CUSTOM(견적 작성 시 입력). */
export type PriceType = 'FIXED' | 'CUSTOM'

export const QUOTE_CATEGORIES: { value: QuoteCategory; label: string }[] = [
  { value: 'PLANNING', label: '기획' },
  { value: 'VOLUNTEER', label: '임직원 자원봉사' },
  { value: 'EXPERIENCE', label: '체험' },
  { value: 'SOUVENIR', label: '기념품' },
  { value: 'OPERATIONS', label: '제작/운영비' },
]

const CATEGORY_LABELS: Record<QuoteCategory, string> = Object.fromEntries(
  QUOTE_CATEGORIES.map((c) => [c.value, c.label]),
) as Record<QuoteCategory, string>

export function categoryLabel(c: QuoteCategory): string {
  return CATEGORY_LABELS[c] ?? c
}

export interface CatalogItem {
  id: number
  category: QuoteCategory
  itemName: string
  unitPrice: number
  unit: string
  priceType: PriceType
  isActive: boolean
  updatedAt: string
}

export interface CatalogCreateRequest {
  category: QuoteCategory
  itemName: string
  unitPrice: number
  unit: string
  priceType: PriceType
}

/** PATCH 부분 수정. 보낸 필드만 변경(isActive로 활성/비활성 전환). */
export interface CatalogUpdateRequest {
  category?: QuoteCategory
  itemName?: string
  unitPrice?: number
  unit?: string
  priceType?: PriceType
  isActive?: boolean
}

export interface CatalogListFilters {
  category?: QuoteCategory | ''
  includeInactive?: boolean
}
