import { Link } from 'react-router-dom'
import { Logo } from '@/components/ui/Logo'
import { APP_NAME, APP_TAGLINE } from '@/lib/constants'

/** 로그인 진입 선택: 관리자 / 파트너. (랜딩 헤더의 "로그인"에서 도달) */
export function LoginChoicePage() {
  return (
    <div className="grid min-h-full place-items-center bg-ink-100 p-4">
      <div className="w-full max-w-md text-center">
        <Link to="/" className="mb-4 inline-flex justify-center">
          <Logo chip className="w-36" />
        </Link>
        <h1 className="text-2xl font-bold text-ink-900">{APP_NAME}</h1>
        <p className="mt-1 text-ink-500">{APP_TAGLINE}</p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link
            to="/admin/login"
            className="rounded-xl border border-ink-200 bg-white p-6 transition-colors hover:border-brand-300 hover:bg-brand-50"
          >
            <div className="text-lg font-semibold text-ink-900">관리자</div>
            <div className="mt-1 text-sm text-ink-500">EcoLink 운영</div>
          </Link>
          <Link
            to="/partner/login"
            className="rounded-xl border border-ink-200 bg-white p-6 transition-colors hover:border-brand-300 hover:bg-brand-50"
          >
            <div className="text-lg font-semibold text-ink-900">파트너십</div>
            <div className="mt-1 text-sm text-ink-500">CSR 담당자</div>
          </Link>
        </div>

        <Link to="/" className="mt-6 inline-block text-sm text-ink-500 hover:text-brand-600">
          ← 홈으로
        </Link>
      </div>
    </div>
  )
}
