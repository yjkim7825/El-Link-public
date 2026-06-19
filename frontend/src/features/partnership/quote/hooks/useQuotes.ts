import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createQuote,
  getMyQuote,
  issueQuote,
  listActiveCatalog,
  listMyQuotes,
} from '@/api/partnerQuote'
import type { QuoteCreateRequest } from '@/types/partnerQuote'

/** 활성 카탈로그 — 자주 안 바뀌므로 staleTime 길게(5분). */
export function useActiveCatalog() {
  return useQuery({
    queryKey: ['partner-catalog'],
    queryFn: listActiveCatalog,
    staleTime: 5 * 60 * 1000,
  })
}

/** 내 견적 목록. */
export function useMyQuotes() {
  return useQuery({
    queryKey: ['my-quotes'],
    queryFn: listMyQuotes,
  })
}

/** 내 견적 단건. */
export function useMyQuote(id: number | null) {
  return useQuery({
    queryKey: ['my-quotes', id],
    queryFn: () => getMyQuote(id as number),
    enabled: id != null && Number.isFinite(id),
  })
}

/** 견적 생성(DRAFT). 성공 시 목록 캐시 무효화. */
export function useCreateQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: QuoteCreateRequest) => createQuote(req),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-quotes'] }),
  })
}

/** 발급(PDF blob 반환). 성공 시 목록 캐시 무효화. */
export function useIssueQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => issueQuote(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-quotes'] }),
  })
}
