import { useQuery } from '@tanstack/react-query'
import { listPartnerDocuments } from '@/api/partnerDocuments'

/** 파트너 서류 목록(type별 그룹). queryKey: ['partner-documents']. */
export function usePartnerDocuments() {
  return useQuery({
    queryKey: ['partner-documents'],
    queryFn: listPartnerDocuments,
  })
}
