import { useState } from 'react'
import { splitKeywords } from '@/lib/keywords'
import { CategoryBadge } from '@/features/admin/materials/components/CategoryBadge'
import { CategoryThumb } from '@/features/admin/materials/components/CategoryThumb'
import { publicThumbnailUrl } from '@/api/publicPortfolio'
import type { PortfolioItem } from '@/types/portfolio'

/**
 * 랜딩 협업 사례 카드. 공개(무인증) 썸네일은 일반 <img>로 직접 로드하고,
 * 대표 이미지가 없어 404가 나면 카테고리 placeholder로 폴백한다.
 */
export function PublicPortfolioCard({ item }: { item: PortfolioItem }) {
  const [imgFailed, setImgFailed] = useState(false)
  const keywords = splitKeywords(item.keywords).slice(0, 3)
  const showImage = item.thumbnailUrl && !imgFailed

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-panel">
      <div className="relative aspect-video overflow-hidden">
        {showImage ? (
          <img
            src={publicThumbnailUrl(item.id)}
            alt={item.title}
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <CategoryThumb category={item.category} className="h-full w-full" />
        )}
        <div className="absolute left-3 top-3">
          <CategoryBadge category={item.category} className="shadow-sm" />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-semibold text-ink-900">{item.title}</h3>
        <p className="mt-2 line-clamp-2 flex-1 text-[15px] leading-relaxed text-ink-700">
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
      </div>
    </article>
  )
}
