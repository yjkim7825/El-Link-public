import { useMutation } from '@tanstack/react-query'
import { analyzeProposal } from '@/api/proposals'

/** 기업명 → 2단계 Gemini 분석. 결과는 폼에 채워 검토 후 저장. */
export function useAnalyzeProposal() {
  return useMutation({
    mutationFn: (companyName: string) => analyzeProposal({ companyName }),
  })
}
