import { useMutation } from '@tanstack/react-query'
import { analyzeMaterial } from '@/api/materials'

/** 자료 분석(파일/텍스트 → Gemini). 결과는 폼에 채워 검토 후 저장. */
export function useAnalyzeMaterial() {
  return useMutation({
    mutationFn: (input: { file?: File | null; text?: string; representativeImage?: File | null }) =>
      analyzeMaterial(input),
  })
}
