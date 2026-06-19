import { AuthImage } from '@/components/ui/AuthImage'
import { splitKeywords } from '@/lib/keywords'
import { CategoryBadge } from '@/features/admin/materials/components/CategoryBadge'
import { CategoryThumb } from '@/features/admin/materials/components/CategoryThumb'
import type { PortfolioItem } from '@/types/portfolio'

/** 포트폴리오 자료 카드. 상단 16:9 이미지(없으면 카테고리 placeholder) + 호버 줌/부상. */
export function PortfolioCard({ item, onClick }: { item: PortfolioItem; onClick: () => void }) {
  const keywords = splitKeywords(item.keywords)
  return (
    <button
      onClick={onClick}
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white text-left shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-panel focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      {/* 이미지 영역 */}
      <div className="relative aspect-video overflow-hidden">
        <AuthImage
          src={item.thumbnailUrl}
          alt={item.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          fallback={<CategoryThumb category={item.category} className="h-full w-full" />}
        />
        <div className="absolute left-3 top-3">
          <CategoryBadge category={item.category} className="shadow-sm" />
        </div>
      </div>

      {/* 본문 */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-semibold text-ink-900 group-hover:text-brand-700">{item.title}</h3>
        <p className="mt-2 line-clamp-3 flex-1 text-[15px] leading-relaxed text-ink-700">
          {item.summary}
        </p>
        {keywords.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {keywords.map((k) => (
              <span
                key={k}
                className="rounded-full bg-ink-100 px-2.5 py-0.5 text-xs font-medium text-ink-600"
              >
                {k}
              </span>
            ))}
          </div>
        )}
        {item.fileCount > 0 && (
          <p className="mt-3 text-xs text-ink-400">📎 첨부 {item.fileCount}</p>
        )}
      </div>
    </button>
  )
}
