import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spinner } from '@/components/ui/Spinner'
import { formatDate, formatWon } from '@/lib/formatters'
import { toApiError } from '@/api/client'
import { toast } from '@/store/toastStore'
import { downloadQuotePdf } from '@/api/partnerQuote'
import { QuoteStatusBadge } from './components/QuoteStatusBadge'
import { useMyQuotes } from './hooks/useQuotes'

export function QuotesListPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError } = useMyQuotes()
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  async function handleDownload(id: number) {
    setDownloadingId(id)
    try {
      await downloadQuotePdf(id)
    } catch (err) {
      toast.error(toApiError(err).message)
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3 text-white">
        <h1 className="text-3xl font-bold">내 견적 목록</h1>
        <button
          onClick={() => navigate('/partner/quote')}
          className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 shadow-sm hover:bg-white/90"
        >
          + 새 견적 작성
        </button>
      </div>

      {isLoading && (
        <div className="py-20">
          <Spinner className="text-white" label="불러오는 중..." />
        </div>
      )}
      {isError && (
        <div className="rounded-xl bg-white/95 px-4 py-3 text-sm text-red-600">
          견적 목록을 불러오지 못했습니다.
        </div>
      )}

      {data &&
        (data.length === 0 ? (
          <div className="rounded-2xl bg-white/95 px-6 py-16 text-center">
            <div className="mb-3 text-4xl">🧾</div>
            <p className="text-[15px] font-medium text-ink-900">작성한 견적이 없습니다</p>
            <p className="mt-1 text-sm text-ink-500">새 견적을 작성해보세요.</p>
            <button
              onClick={() => navigate('/partner/quote')}
              className="mt-5 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
            >
              + 새 견적 작성
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-card">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-ink-700">
                <tr>
                  <th className="px-4 py-3 text-left">견적 번호</th>
                  <th className="px-4 py-3 text-left">발주처</th>
                  <th className="px-4 py-3 text-center">상태</th>
                  <th className="px-4 py-3 text-right">총액</th>
                  <th className="px-4 py-3 text-center">항목</th>
                  <th className="px-4 py-3 text-center">작성일</th>
                  <th className="px-4 py-3 text-center">발급일</th>
                  <th className="px-4 py-3 text-center">액션</th>
                </tr>
              </thead>
              <tbody>
                {data.map((q) => (
                  <tr key={q.id} className="border-t border-ink-100 hover:bg-ink-50">
                    <td className="px-4 py-3 font-medium text-ink-900">No.{q.id}</td>
                    <td className="px-4 py-3 text-ink-700">{q.clientCompanyName ?? '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <QuoteStatusBadge status={q.status} />
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-ink-900">
                      {formatWon(q.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-center text-ink-600">{q.itemCount}</td>
                    <td className="px-4 py-3 text-center text-ink-600">{formatDate(q.createdAt)}</td>
                    <td className="px-4 py-3 text-center text-ink-600">
                      {q.issuedAt ? formatDate(q.issuedAt) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-3">
                        {q.status === 'DRAFT' ? (
                          <button
                            onClick={() => navigate(`/partner/quote?draftId=${q.id}`)}
                            className="text-sm font-medium text-brand-600 hover:underline"
                          >
                            이어 작성하기
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDownload(q.id)}
                            disabled={downloadingId === q.id}
                            className="text-sm font-medium text-brand-600 hover:underline disabled:opacity-50"
                          >
                            {downloadingId === q.id ? '다운로드 중…' : 'PDF 다운로드'}
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/partner/quotes/${q.id}`)}
                          className="text-sm font-medium text-ink-600 hover:underline"
                        >
                          상세
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </div>
  )
}
