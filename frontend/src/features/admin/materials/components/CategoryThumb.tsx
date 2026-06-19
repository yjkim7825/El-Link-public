import { cn } from '@/lib/cn'

/**
 * 대표 이미지가 없을 때 쓰는 카테고리 컬러 placeholder. 백엔드 시드 단색 PNG와 톤 일치.
 * 기본 4종 색상, 그 외는 중립색.
 */
const CATEGORY_BG: Record<string, string> = {
  '환경 교육': 'bg-emerald-500',
  체험: 'bg-sky-500',
  봉사: 'bg-amber-500',
  업사이클링: 'bg-violet-500',
}

export function CategoryThumb({
  category,
  className,
}: {
  category: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-center text-center',
        CATEGORY_BG[category] ?? 'bg-slate-400',
        className,
      )}
    >
      <span className="px-3 text-base font-bold text-white/90 drop-shadow-sm">{category}</span>
    </div>
  )
}
