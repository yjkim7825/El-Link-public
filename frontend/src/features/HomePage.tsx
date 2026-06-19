import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Logo } from '@/components/ui/Logo'
import { listPublicPortfolio } from '@/api/publicPortfolio'
import { PublicPortfolioCard } from './landing/PublicPortfolioCard'

const CONTAINER = 'mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8'

/** 성과 지표 — 시연용 시드 값(정확한 수치는 추후 확정). */
const STATS = [
  { value: '50+', label: '함께한 협업사' },
  { value: '30+', label: '기획한 프로그램' },
  { value: '1,200kg+', label: '재생된 자원' },
  { value: '5,000명+', label: '참여 인원' },
]

const SOLUTIONS = [
  {
    icon: '📁',
    title: '자료 자동 정리',
    desc: 'AI가 협업 자료를 읽고 카테고리·키워드까지 자동으로 분류해 한곳에 정리합니다.',
  },
  {
    icon: '🤝',
    title: '협업 아이디어 추천',
    desc: '기업명만 입력하면 기업 분석과 함께 맞춤형 협업 아이디어를 추천받을 수 있습니다.',
  },
  {
    icon: '📋',
    title: '서류·견적 자동화',
    desc: '협업에 필요한 서류 발급과 모의 견적 산출을 한 번에 처리합니다.',
  },
]

/** 공개 랜딩(/). 인증 불필요 — 히어로 + 성과지표 + 솔루션 + 협업 사례 + 푸터. */
export function HomePage() {
  const { data } = useQuery({
    queryKey: ['public-portfolio'],
    queryFn: listPublicPortfolio,
  })
  const previews = (data ?? []).slice(0, 4)

  return (
    <div className="min-h-full bg-white">
      {/* ===== 히어로 (풀폭 블루) ===== */}
      <header className="relative overflow-hidden bg-gradient-to-b from-brand-500 to-brand-700 text-white">
        {/* 상단 바 */}
        <div className={`${CONTAINER} flex h-16 items-center justify-between`}>
          <Logo className="w-28" />
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/admin/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white"
            >
              관리자 로그인
            </Link>
            <Link
              to="/partner/login"
              className="rounded-lg bg-white/15 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/25"
            >
              파트너 로그인
            </Link>
          </nav>
        </div>

        {/* 히어로 본문 */}
        <div className={`${CONTAINER} grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-2 lg:py-24`}>
          <div>
            <p className="text-sm font-semibold text-white/80">EcoLink 파트너십</p>
            <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
              함께 만드는 자원순환 협업
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">
              사회적기업 EcoLink가 제안하는 ESG 협업 솔루션.
              협업 사례를 둘러보고, 우리 회사와 어울리는 협업을 찾아보세요.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/partner/login"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-white px-6 text-base font-bold text-brand-700 shadow-card transition-transform hover:-translate-y-0.5"
              >
                포트폴리오 둘러보기
              </Link>
              <Link
                to="/admin/login"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-white/40 px-6 text-base font-bold text-white transition-colors hover:bg-white/10"
              >
                관리자 로그인
              </Link>
            </div>
          </div>

          {/* 일러스트 영역 */}
          <div className="hidden lg:block">
            <div className="relative mx-auto aspect-square w-full max-w-md rounded-3xl bg-white/10 p-8 backdrop-blur">
              <div className="grid h-full grid-cols-2 grid-rows-2 gap-4">
                {['♻️', '🌱', '🤝', '📦'].map((emoji) => (
                  <div
                    key={emoji}
                    className="flex items-center justify-center rounded-2xl bg-white/15 text-5xl"
                  >
                    {emoji}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ===== 성과 지표 ===== */}
      <section className="bg-ink-50 py-16 sm:py-20">
        <div className={CONTAINER}>
          <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl bg-white p-6 text-center shadow-card sm:p-8"
              >
                <div className="text-3xl font-extrabold text-brand-600 sm:text-4xl">{s.value}</div>
                <div className="mt-2 text-sm font-medium text-ink-500 sm:text-base">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 솔루션 소개 ===== */}
      <section className="bg-white py-16 sm:py-20">
        <div className={CONTAINER}>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-ink-900 sm:text-3xl">El-Link이 해결합니다</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-500 sm:text-base">
              협업 준비부터 추천·서류·견적까지, 흩어져 있던 과정을 한 흐름으로 잇습니다.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {SOLUTIONS.map((s) => (
              <div
                key={s.title}
                className="rounded-2xl border border-ink-100 bg-white p-7 shadow-card"
              >
                <div className="text-4xl">{s.icon}</div>
                <h3 className="mt-4 text-lg font-semibold text-ink-900">{s.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 협업 사례 미리보기 ===== */}
      {previews.length > 0 && (
        <section className="bg-ink-50 py-16 sm:py-20">
          <div className={CONTAINER}>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-ink-900 sm:text-3xl">협업 사례</h2>
                <p className="mt-2 text-[15px] text-ink-500 sm:text-base">
                  EcoLink가 진행해 온 자원순환 협업 활동입니다.
                </p>
              </div>
              <Link
                to="/partner/login"
                className="hidden shrink-0 text-sm font-semibold text-brand-600 hover:underline sm:block"
              >
                더 보기 →
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {previews.map((item) => (
                <PublicPortfolioCard key={item.id} item={item} />
              ))}
            </div>
            <div className="mt-8 text-center sm:hidden">
              <Link
                to="/partner/login"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-6 text-sm font-bold text-white"
              >
                더 보기
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ===== 푸터 ===== */}
      <footer className="border-t border-ink-100 bg-white py-10">
        <div className={`${CONTAINER} text-center`}>
          <div className="flex justify-center">
            <Logo chip className="w-28" />
          </div>
          <p className="mt-4 text-sm font-medium text-ink-700">사회적기업 EcoLink</p>
          <p className="mt-1 text-xs text-ink-400">
            이 사이트는 협업 사례 안내 및 파트너 협업 지원을 위한 공간입니다.
          </p>
          <p className="mt-4 text-xs text-ink-400">© 2026 EcoLink. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
