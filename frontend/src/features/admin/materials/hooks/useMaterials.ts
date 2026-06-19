import { useQuery } from '@tanstack/react-query'
import { listMaterials } from '@/api/materials'
import type { MaterialListFilters } from '@/types/material'

/** 목록 조회. queryKey: ['materials', filters]. */
export function useMaterials(filters: MaterialListFilters) {
  return useQuery({
    queryKey: ['materials', filters],
    queryFn: () => listMaterials(filters),
  })
}
