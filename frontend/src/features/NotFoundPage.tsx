import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="grid min-h-full place-items-center bg-ink-100 p-4 text-center">
      <div>
        <div className="text-5xl font-bold text-brand-500">404</div>
        <p className="mt-2 text-ink-600">페이지를 찾을 수 없습니다.</p>
        <Link to="/" className="mt-4 inline-block text-sm text-brand-600 hover:underline">
          홈으로 →
        </Link>
      </div>
    </div>
  )
}
