import { useQuery } from '@tanstack/react-query'
import { listIssues } from '@/api/documents'
import type { DocumentIssueFilters } from '@/types/document'

/** 발급 이력(파트너/기간 필터). queryKey: ['document-issues', filters]. */
export function useDocumentIssues(filters: DocumentIssueFilters) {
  return useQuery({
    queryKey: ['document-issues', filters],
    queryFn: () => listIssues(filters),
  })
}
