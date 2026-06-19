import { toApiError } from '@/api/client'

/**
 * AI(Gemini) 호출 에러를 사용자 친화 메시지로 변환.
 * - 키 미설정(GEMINI_API_KEY 없음): 설정 안내
 * - 그 외 GEMINI_ERROR(쿼터 초과/일시 장애): 재시도 안내
 * - 비-AI 에러: 백엔드 메시지 그대로
 */
export function aiErrorMessage(err: unknown): string {
  const e = toApiError(err)
  if (e.code === 'GEMINI_ERROR') {
    if (e.message && e.message.includes('GEMINI_API_KEY')) {
      return 'AI 분석 기능을 사용하려면 GEMINI_API_KEY 설정이 필요합니다. (다른 기능은 정상 동작합니다)'
    }
    return 'AI 분석 일시 장애입니다. 잠시 후 다시 시도해주세요.'
  }
  return e.message
}
