import { useQuery } from '@tanstack/react-query'
import { listProposals } from '@/api/proposals'

/** 목록 조회. queryKey: ['proposals']. */
export function useProposals() {
  return useQuery({
    queryKey: ['proposals'],
    queryFn: listProposals,
  })
}
