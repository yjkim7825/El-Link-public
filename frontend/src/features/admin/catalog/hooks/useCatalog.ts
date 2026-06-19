import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listCatalog } from '@/api/catalog'
import type { CatalogListFilters } from '@/types/catalog'

/**
 * 카탈로그 목록 + 클라이언트사이드 필터(카테고리 / 비활성 포함).
 * 백엔드가 전체(비활성 포함)만 주므로 한 번 받아 메모리에서 거른다.
 */
export function useCatalog(filters: CatalogListFilters) {
  const query = useQuery({
    queryKey: ['catalog'],
    queryFn: listCatalog,
  })

  const filtered = useMemo(() => {
    const all = query.data ?? []
    return all.filter((c) => {
      if (filters.category && c.category !== filters.category) return false
      if (!filters.includeInactive && !c.isActive) return false
      return true
    })
  }, [query.data, filters.category, filters.includeInactive])

  return { ...query, data: filtered }
}
