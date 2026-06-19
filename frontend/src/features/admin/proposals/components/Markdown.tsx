import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/cn'

/** 기업 분석 마크다운 렌더. Tailwind Typography(prose) 기반, 브랜드 톤. */
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div
      className={cn(
        'prose prose-sm max-w-none text-ink-800',
        'prose-headings:text-ink-900 prose-headings:font-semibold',
        'prose-strong:text-ink-900 prose-a:text-brand-600',
        'prose-li:my-0.5',
        className,
      )}
    >
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  )
}
