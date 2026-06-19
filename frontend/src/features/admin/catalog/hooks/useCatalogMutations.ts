import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createCatalog, deleteCatalog, updateCatalog } from '@/api/catalog'
import type { CatalogCreateRequest, CatalogUpdateRequest } from '@/types/catalog'

/** 신규 등록. 성공 시 목록 캐시 무효화. */
export function useCreateCatalog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: CatalogCreateRequest) => createCatalog(req),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog'] }),
  })
}

/** 수정/활성·비활성 전환(PATCH). 성공 시 목록 캐시 무효화. */
export function useUpdateCatalog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: number; req: CatalogUpdateRequest }) =>
      updateCatalog(vars.id, vars.req),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog'] }),
  })
}

/** soft delete. 성공 시 목록 캐시 무효화. */
export function useDeleteCatalog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteCatalog(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog'] }),
  })
}
