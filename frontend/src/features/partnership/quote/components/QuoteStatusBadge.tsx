import { cn } from '@/lib/cn'
import type { QuoteStatus } from '@/types/partnerQuote'

/** 견적 상태 뱃지. DRAFT=회색, ISSUED=그린. */
export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        status === 'ISSUED' ? 'bg-green-100 text-green-700' : 'bg-ink-200 text-ink-700',
      )}
    >
      {status === 'ISSUED' ? '발급완료' : '임시저장'}
    </span>
  )
}
