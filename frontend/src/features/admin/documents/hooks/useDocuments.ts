import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listDocuments } from '@/api/documents'
import type { DocumentListFilters } from '@/types/document'

/**
 * 문서 목록 + 클라이언트사이드 필터(종류 / 비활성 포함).
 * 백엔드가 전체(비활성 포함)만 주므로 한 번 받아 메모리에서 거른다.
 */
export function useDocuments(filters: DocumentListFilters) {
  const query = useQuery({
    queryKey: ['documents'],
    queryFn: listDocuments,
  })

  const filtered = useMemo(() => {
    const all = query.data ?? []
    return all.filter((d) => {
      if (filters.type && d.type !== filters.type) return false
      if (!filters.includeInactive && !d.isActive) return false
      return true
    })
  }, [query.data, filters.type, filters.includeInactive])

  return { ...query, data: filtered }
}
