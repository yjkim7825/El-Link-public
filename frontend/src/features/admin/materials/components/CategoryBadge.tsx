import { cn } from '@/lib/cn'

/**
 * 카테고리별 일관 색상 뱃지. 백엔드 고정 4종(환경 교육/체험/봉사/업사이클링)에 색을 매핑하고,
 * 그 외(직접 입력 등)는 중립색으로 폴백한다.
 */
const CATEGORY_TONES: Record<string, string> = {
  '환경 교육': 'bg-emerald-50 text-emerald-700',
  체험: 'bg-sky-50 text-sky-700',
  봉사: 'bg-amber-50 text-amber-700',
  업사이클링: 'bg-violet-50 text-violet-700',
}
const FALLBACK = 'bg-ink-100 text-ink-700'

interface CategoryBadgeProps {
  category: string
  className?: string
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        CATEGORY_TONES[category] ?? FALLBACK,
        className,
      )}
    >
      {category}
    </span>
  )
}
