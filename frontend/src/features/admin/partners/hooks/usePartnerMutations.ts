import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createPartner, updatePartnerStatus } from '@/api/partners'
import type { CreatePartnerRequest, PartnerStatus } from '@/types/partner'

/** 파트너 등록. 성공 시 목록 캐시 무효화. */
export function useCreatePartner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: CreatePartnerRequest) => createPartner(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partners'] })
    },
  })
}

/** 상태 전환(ACTIVE/DISABLED). 성공 시 목록 캐시 무효화. */
export function useUpdatePartnerStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: number; status: Extract<PartnerStatus, 'ACTIVE' | 'DISABLED'> }) =>
      updatePartnerStatus(vars.id, vars.status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partners'] })
    },
  })
}
