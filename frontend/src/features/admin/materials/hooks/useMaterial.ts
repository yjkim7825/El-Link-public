import { useQuery } from '@tanstack/react-query'
import { getMaterial } from '@/api/materials'

/** 단건 조회. queryKey: ['materials', id]. */
export function useMaterial(id: number) {
  return useQuery({
    queryKey: ['materials', id],
    queryFn: () => getMaterial(id),
    enabled: Number.isFinite(id),
  })
}
