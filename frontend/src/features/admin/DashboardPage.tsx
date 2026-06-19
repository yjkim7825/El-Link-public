import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { formatDate, formatDateTime } from '@/lib/formatters'
import { CategoryThumb } from '@/features/admin/materials/components/CategoryThumb'
import { useMaterials } from '@/features/admin/materials/hooks/useMaterials'
import { useProposals } from '@/features/admin/proposals/hooks/useProposals'
import { usePartners } from '@/features/admin/partners/hooks/usePartners'
import { useCatalog } from '@/features/admin/catalog/hooks/useCatalog'
import { useDocuments } from '@/features/admin/documents/hooks/useDocuments'
import { useDocumentIssues } from '@/features/admin/documents/hooks/useDocumentIssues'

/** createdAt/issuedAt 기준 최신순 정렬 후 상위 n건. */
function recent<T>(items: T[] | undefined, key: (t: T) => string, n = 3): T[] {
  return [...(items ?? [])]
    .sort((a, b) => new Date(key(b)).getTime() - new Date(key(a)).getTime())
    .slice(0, n)
}

export function AdminDashboardPage() {
  const user = useAuthStore((s) => s.user)

  const materials = useMaterials({})
  const proposals = useProposals()
  const partners = usePartners({})
  const catalog = useCatalog({}) // 활성 단가만
  const documents = useDocuments({}) // 활성 서류만
  const issues = useDocumentIssues({})

  const cards = [
    {
      to: '/admin/materials',
      icon: '📄',
      label: '자료',
      count: materials.data?.length,
      unit: '개',
      desc: 'AI 기반 자료 자동 분류·관리',
    },
    {
      to: '/admin/proposals',
      icon: '🤝',
      label: '협업 아이디어 추천',
      count: proposals.data?.length,
      unit: '건',
      desc: '기업 분석 + 맞춤 협업 아이디어 추천',
    },
    {
      to: '/admin/partners',
      icon: '🏢',
      label: '파트너',
      count: partners.data?.length,
      unit: '곳',
      desc: '파트너사 계정 등록·상태 관리',
    },
    {
      to: '/admin/catalog',
      icon: '💰',
      label: '단가표',
      count: catalog.data?.length,
      unit: '종',
      desc: '견적 품목·단가 기준 정보',
    },
    {
      to: '/admin/documents',
      icon: '🗂️',
      label: '서류',
      count: documents.data?.length,
      unit: '종',
      desc: '회사 서류 등록·발급 이력 관리',
    },
  ]

  const recentMaterials = recent(materials.data, (m) => m.createdAt)
  const recentProposals = recent(proposals.data, (p) => p.createdAt)
  const recentIssues = recent(issues.data, (i) => i.issuedAt)

  return (
    <div>
      {/* 환영 메시지 */}
      <h1 className="text-2xl font-bold text-ink-900">대시보드</h1>
      <p className="mt-2 text-[15px] text-ink-500">
        {user?.name ? `${user.name}님, ` : ''}EcoLink 운영 콘솔에 오신 것을 환영합니다.
      </p>

      {/* 도메인 카드 — lg 3열(3-2), xl 5열 */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="group flex flex-col rounded-xl border border-ink-200 bg-white p-5 shadow-card transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">{c.icon}</span>
              <span className="text-ink-300 transition-colors group-hover:text-brand-500">→</span>
            </div>
            <div className="mt-3 text-sm font-medium text-ink-700">{c.label}</div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-ink-900">
                {c.count ?? '–'}
              </span>
              <span className="text-sm text-ink-400">{c.unit}</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink-400">{c.desc}</p>
          </Link>
        ))}
      </div>

      {/* 최근 활동 위젯 — 3열 */}
      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {/* 최근 자료 */}
        <Widget title="최근 등록 자료" to="/admin/materials" empty={recentMaterials.length === 0}>
          <ul className="space-y-3">
            {recentMaterials.map((m) => (
              <li key={m.id}>
                <Link
                  to={`/admin/materials/${m.id}`}
                  className="flex items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-ink-50"
                >
                  <CategoryThumb
                    category={m.category}
                    className="h-11 w-16 shrink-0 rounded-md text-[10px]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink-900">{m.title}</div>
                    <div className="mt-0.5 text-xs text-ink-400">
                      {m.category} · {formatDate(m.createdAt)}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Widget>

        {/* 최근 협업 아이디어 추천 */}
        <Widget title="최근 협업 아이디어 추천" to="/admin/proposals" empty={recentProposals.length === 0}>
          <ul className="space-y-2">
            {recentProposals.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/admin/proposals/${p.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-ink-50"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-ink-900">
                      {p.targetCompanyName}
                    </div>
                    <div className="mt-0.5 text-xs text-ink-400">{formatDate(p.createdAt)}</div>
                  </div>
                  <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                    아이디어 {p.ideaCount}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Widget>

        {/* 최근 서류 발급 */}
        <Widget title="최근 서류 발급" to="/admin/documents/issues" empty={recentIssues.length === 0}>
          <ul className="space-y-2">
            {recentIssues.map((i) => (
              <li
                key={i.id}
                className="flex items-center justify-between gap-3 rounded-lg px-2 py-2"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-ink-900">
                    {i.partnerCompanyName}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-ink-400">{i.documentTitle}</div>
                </div>
                <span className="shrink-0 text-xs text-ink-400">{formatDateTime(i.issuedAt)}</span>
              </li>
            ))}
          </ul>
        </Widget>
      </div>
    </div>
  )
}

function Widget({
  title,
  to,
  empty,
  children,
}: {
  title: string
  to: string
  empty: boolean
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
        <Link to={to} className="text-xs font-medium text-brand-600 hover:underline">
          전체 보기
        </Link>
      </div>
      {empty ? (
        <p className="py-6 text-center text-xs text-ink-400">아직 등록된 내역이 없습니다.</p>
      ) : (
        children
      )}
    </section>
  )
}
