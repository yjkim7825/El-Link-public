import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createProposal, deleteProposal } from '@/api/proposals'
import type { ProposalCreateRequest } from '@/types/proposal'

/** 확정 저장. 성공 시 목록 캐시 무효화. */
export function useCreateProposal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: ProposalCreateRequest) => createProposal(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['proposals'] })
    },
  })
}

/** 삭제. 성공 시 목록 캐시 무효화. */
export function useDeleteProposal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteProposal(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['proposals'] })
    },
  })
}
