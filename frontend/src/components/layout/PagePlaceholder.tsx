interface PagePlaceholderProps {
  title: string
  description?: string
}

/** 도메인 페이지 구현 전 임시 자리표시 컴포넌트. */
export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <div>
      <h1 className="text-xl font-semibold text-ink-900">{title}</h1>
      <p className="mt-2 text-sm text-ink-500">
        {description ?? '이 화면은 다음 단계에서 구현됩니다.'}
      </p>
      <div className="mt-6 rounded-xl border border-dashed border-ink-300 bg-white p-10 text-center text-sm text-ink-400">
        준비 중
      </div>
    </div>
  )
}
