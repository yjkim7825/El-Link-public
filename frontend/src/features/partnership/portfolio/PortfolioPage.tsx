import { useMemo, useState } from 'react'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/cn'
import { distinctCategories } from '@/lib/categories'
import { PortfolioCard } from './components/PortfolioCard'
import { PortfolioDetailModal } from './components/PortfolioDetailModal'
import { usePortfolio } from './hooks/usePortfolio'

export function PortfolioPage() {
  const [category, setCategory] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  // 전체를 받아 칩은 실제 존재하는 카테고리에서 추출하고, 선택 필터는 클라이언트에서 적용.
  const { data, isLoading, isError } = usePortfolio({})

  const all = useMemo(() => data ?? [], [data])
  const categories = useMemo(() => distinctCategories(all), [all])
  const visible = useMemo(
    () => (category ? all.filter((m) => m.category === category) : all),
    [all, category],
  )

  return (
    <div>
      {/* 히어로 */}
      <section className="mb-8 text-white">
        <p className="text-sm font-medium text-white/80">EcoLink 파트너십</p>
        <h1 className="mt-1 text-3xl font-bold leading-tight sm:text-4xl">
          함께 만드는 자원순환 협업
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/90">
          EcoLink가 진행해 온 활동을 둘러보고, 우리 회사와 어울리는 협업을 찾아보세요.
        </p>
      </section>

      {/* 카테고리 필터 칩 — 자료가 있을 때만, 실제 존재하는 카테고리만 노출 */}
      {categories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <FilterChip label="전체" active={category === ''} onClick={() => setCategory('')} />
          {categories.map((c) => (
            <FilterChip key={c} label={c} active={category === c} onClick={() => setCategory(c)} />
          ))}
        </div>
      )}

      {isLoading && (
        <div className="py-20">
          <Spinner className="text-white" label="불러오는 중..." />
        </div>
      )}
      {isError && (
        <div className="rounded-xl bg-white/95 px-4 py-3 text-sm text-red-600">
          자료를 불러오지 못했습니다.
        </div>
      )}

      {data &&
        (visible.length === 0 ? (
          <div className="rounded-2xl bg-white/95 px-6 py-16 text-center">
            <div className="mb-3 text-4xl">📭</div>
            <p className="text-[15px] font-medium text-ink-900">표시할 자료가 없습니다</p>
            <p className="mt-1 text-sm text-ink-500">
              {category ? '이 카테고리에 등록된 자료가 없습니다.' : '곧 다양한 활동이 업데이트됩니다.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {visible.map((item) => (
              <PortfolioCard key={item.id} item={item} onClick={() => setSelectedId(item.id)} />
            ))}
          </div>
        ))}

      <PortfolioDetailModal id={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'bg-white text-brand-700 shadow-sm'
          : 'bg-white/15 text-white/90 hover:bg-white/25',
      )}
    >
      {label}
    </button>
  )
}
