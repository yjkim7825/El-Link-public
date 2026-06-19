import { useEffect, useState } from 'react'

const STAGES = ['기업 정보 조사 중…', '보유 자료와 매칭 중…', '협업 아이디어 도출 중…']

/**
 * 2단계 Gemini 분석(10~15초) 동안 표시하는 단계별 진행 인디케이터.
 * 실제 단계 신호는 없으므로 시간 기반으로 메시지를 순차 전환한다.
 */
export function AnalyzingIndicator() {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 5000)
    const t2 = setTimeout(() => setStage(2), 10000)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-brand-500" />
      <div>
        <p className="text-[15px] font-medium text-ink-900">{STAGES[stage]}</p>
        <p className="mt-1 text-xs text-ink-500">AI가 분석 중입니다. 10~15초 정도 걸려요.</p>
      </div>
      <div className="flex gap-1.5">
        {STAGES.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-6 rounded-full ${i <= stage ? 'bg-brand-500' : 'bg-ink-200'}`}
          />
        ))}
      </div>
    </div>
  )
}
