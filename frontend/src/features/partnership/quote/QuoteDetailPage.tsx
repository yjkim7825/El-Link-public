import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Spinner } from '@/components/ui/Spinner'
import { formatDate, formatWon } from '@/lib/formatters'
import { toApiError } from '@/api/client'
import { toast } from '@/store/toastStore'
import { downloadQuotePdf } from '@/api/partnerQuote'
import { QuoteStatusBadge } from './components/QuoteStatusBadge'
import { useMyQuote } from './hooks/useQuotes'

export function QuoteDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const quoteId = Number(id)
  const { data, isLoading, isError } = useMyQuote(quoteId)
  const [downloading, setDownloading] = useState(false)

  async function handleDownload() {
    setDownloading(true)
    try {
      await downloadQuotePdf(quoteId)
    } catch (err) {
      toast.error(toApiError(err).message)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center gap-3 text-white">
        <button
          onClick={() => navigate('/partner/quotes')}
          className="text-sm text-white/80 hover:text-white"
        >
          ← 목록
        </button>
        <h1 className="text-2xl font-bold">견적 상세</h1>
      </div>

      {isLoading && (
        <div className="py-20">
          <Spinner className="text-white" label="불러오는 중..." />
        </div>
      )}
      {isError && (
        <div className="rounded-xl bg-white/95 px-4 py-3 text-sm text-red-600">
          견적을 찾을 수 없습니다.
        </div>
      )}

      {data && (
        <div className="rounded-2xl bg-white p-6 shadow-card">
          {/* 견적 정보 */}
          <div className="mb-5 flex items-start justify-between gap-4 border-b border-ink-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-ink-900">견적서 No.{data.id}</h2>
                <QuoteStatusBadge status={data.status} />
              </div>
              <p className="mt-1 text-sm text-ink-500">
                작성 {formatDate(data.createdAt)}
                {data.issuedAt && ` · 발급 ${formatDate(data.issuedAt)}`}
                {data.status === 'ISSUED' && data.validUntil && ` · 유효 ~ ${formatDate(data.validUntil)}`}
              </p>
              <p className="mt-0.5 text-sm text-ink-500">
                발주처 <span className="font-medium text-ink-700">{data.clientCompanyName ?? '-'}</span>
              </p>
            </div>
            {data.status === 'ISSUED' ? (
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="shrink-0 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {downloading ? '다운로드 중…' : 'PDF 다운로드'}
              </button>
            ) : (
              <button
                onClick={() => navigate(`/partner/quote?draftId=${data.id}`)}
                className="shrink-0 rounded-lg border border-ink-300 px-4 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50"
              >
                이어 작성하기
              </button>
            )}
          </div>

          {/* 품목 표 */}
          <div className="overflow-x-auto rounded-lg border border-brand-100">
            <table className="w-full text-sm">
              <thead className="bg-brand-50 text-brand-800">
                <tr>
                  <th className="px-3 py-2 text-center">#</th>
                  <th className="px-3 py-2 text-left">품명</th>
                  <th className="px-3 py-2 text-right">단가</th>
                  <th className="px-3 py-2 text-center">수량</th>
                  <th className="px-3 py-2 text-center">일수</th>
                  <th className="px-3 py-2 text-right">소계</th>
                </tr>
              </thead>
              <tbody>
                {[...data.items]
                  .sort((a, b) => a.orderIndex - b.orderIndex)
                  .map((it, i) => (
                    <tr key={it.id} className="border-t border-ink-100">
                      <td className="px-3 py-2 text-center text-ink-500">{i + 1}</td>
                      <td className="px-3 py-2 text-ink-900">{it.itemName}</td>
                      <td className="px-3 py-2 text-right text-ink-700">{formatWon(it.unitPrice)}</td>
                      <td className="px-3 py-2 text-center text-ink-700">{it.quantity}</td>
                      <td className="px-3 py-2 text-center text-ink-700">{it.days}</td>
                      <td className="px-3 py-2 text-right font-medium text-ink-900">
                        {formatWon(it.subtotal)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* 금액 분해 */}
          <div className="mt-4 ml-auto w-full max-w-xs space-y-1.5 text-sm">
            <SummaryRow label="라인합" value={data.subtotalSum} />
            <SummaryRow label="기업이윤 (10%)" value={data.companyProfit} />
            <SummaryRow label="공급가액" value={data.supplyAmount} />
            <SummaryRow label="부가세 (10%)" value={data.vat} />
            <div className="flex justify-between border-t-2 border-t-brand-500 pt-2">
              <span className="font-semibold text-ink-800">합계 (VAT 포함)</span>
              <span className="text-lg font-bold text-brand-700">{formatWon(data.totalAmount)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-ink-600">
      <span>{label}</span>
      <span className="font-medium text-ink-800">{formatWon(value)}</span>
    </div>
  )
}
