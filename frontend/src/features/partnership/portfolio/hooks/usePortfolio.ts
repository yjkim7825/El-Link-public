import { useQuery } from '@tanstack/react-query'
import { getPortfolioItem, listPortfolio } from '@/api/partnerPortfolio'
import type { PortfolioFilters } from '@/types/portfolio'

/** 포트폴리오 목록. queryKey: ['portfolio', filters]. */
export function usePortfolio(filters: PortfolioFilters) {
  return useQuery({
    queryKey: ['portfolio', filters],
    queryFn: () => listPortfolio(filters),
  })
}

/** 포트폴리오 단건. queryKey: ['portfolio', id]. */
export function usePortfolioItem(id: number | null) {
  return useQuery({
    queryKey: ['portfolio', 'item', id],
    queryFn: () => getPortfolioItem(id as number),
    enabled: id != null && Number.isFinite(id),
  })
}
