import { cn } from '@/lib/cn'
import type { PriceType } from '@/types/catalog'

/** 단가 유형 뱃지. FIXED=브랜드, CUSTOM=앰버. */
export function PriceTypeBadge({ type }: { type: PriceType }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        type === 'FIXED' ? 'bg-brand-100 text-brand-700' : 'bg-amber-100 text-amber-700',
      )}
    >
      {type === 'FIXED' ? '고정' : '입력형'}
    </span>
  )
}

/** 활성/비활성 뱃지. */
export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        active ? 'bg-green-100 text-green-700' : 'bg-ink-200 text-ink-600',
      )}
    >
      {active ? '활성' : '비활성'}
    </span>
  )
}
