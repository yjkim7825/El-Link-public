import { useMemo } from 'react'
import { distinctCategories } from '@/lib/categories'
import { useMaterials } from './useMaterials'

/**
 * 전체 자료에서 distinct 카테고리 추출(필터와 무관하게 항상 전체 기준).
 * 카테고리는 자유 입력 String이므로 하드코딩 대신 실제 데이터에서 만든다.
 */
export function useMaterialCategories(): string[] {
  const { data } = useMaterials({})
  return useMemo(() => distinctCategories(data ?? []), [data])
}
