import type { ProposalMaterialRef } from '@/types/proposal'

/** 아이디어에 매칭된 관련 자료 뱃지. 클릭 시 새 창에서 자료 상세로 이동. */
export function RelatedMaterialBadges({ materials }: { materials: ProposalMaterialRef[] }) {
  if (materials.length === 0) {
    return <p className="text-xs text-ink-400">관련 자료 없음</p>
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {materials.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => window.open(`/admin/materials/${m.id}`, '_blank', 'noopener')}
          className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 hover:bg-brand-100"
          title="새 창에서 자료 상세 보기"
        >
          📎 {m.title}
        </button>
      ))}
    </div>
  )
}
