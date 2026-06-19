import { useQuery } from '@tanstack/react-query'
import { getProposal } from '@/api/proposals'

/** 단건 조회. queryKey: ['proposals', id]. */
export function useProposal(id: number) {
  return useQuery({
    queryKey: ['proposals', id],
    queryFn: () => getProposal(id),
    enabled: Number.isFinite(id),
  })
}
