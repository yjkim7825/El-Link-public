import { aiErrorMessage } from '@/lib/aiError'

/**
 * 협업 제안 분석 에러 메시지. 공통 AI 에러 헬퍼에 위임
 * (키 미설정 안내 / 일시 장애 재시도 / 그 외 백엔드 메시지).
 */
export function analyzeErrorMessage(err: unknown): string {
  return aiErrorMessage(err)
}
