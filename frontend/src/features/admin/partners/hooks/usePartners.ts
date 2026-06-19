import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listPartners } from '@/api/partners'
import type { PartnerListFilters } from '@/types/partner'

/**
 * 파트너 목록 + 클라이언트사이드 필터(상태/키워드).
 * 백엔드가 전체 목록만 주므로 한 번 받아 메모리에서 거른다.
 */
export function usePartners(filters: PartnerListFilters) {
  const query = useQuery({
    queryKey: ['partners'],
    queryFn: listPartners,
  })

  const filtered = useMemo(() => {
    const all = query.data ?? []
    const kw = filters.keyword?.trim().toLowerCase()
    return all.filter((p) => {
      if (filters.status && p.status !== filters.status) return false
      if (kw) {
        const hay = `${p.companyName} ${p.contactName} ${p.email}`.toLowerCase()
        if (!hay.includes(kw)) return false
      }
      return true
    })
  }, [query.data, filters.status, filters.keyword])

  return { ...query, data: filtered }
}
