import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createMaterial, deleteMaterial } from '@/api/materials'
import type { MaterialCreateRequest } from '@/types/material'

/** 확정 저장. 성공 시 목록 캐시 무효화. */
export function useCreateMaterial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: MaterialCreateRequest) => createMaterial(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['materials'] })
    },
  })
}

/** 삭제. 성공 시 목록 캐시 무효화. */
export function useDeleteMaterial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteMaterial(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['materials'] })
    },
  })
}
