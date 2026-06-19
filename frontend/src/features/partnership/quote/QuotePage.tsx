import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Spinner } from '@/components/ui/Spinner'
import { formatWon } from '@/lib/formatters'
import { toApiError } from '@/api/client'
import { toast } from '@/store/toastStore'
import { saveBlob } from '@/api/partnerQuote'
import { QUOTE_CATEGORIES, type QuoteCategory } from '@/types/catalog'
import type { ActiveCatalogItem, QuoteItemPayload, QuoteLine } from '@/types/partnerQuote'
import { useActiveCatalog, useCreateQuote, useIssueQuote, useMyQuote } from './hooks/useQuotes'

export function QuotePage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const draftId = params.get('draftId') ? Number(params.get('draftId')) : null

  const { data: catalog, isLoading: catalogLoading } = useActiveCatalog()
  const { data: draft } = useMyQuote(draftId)
  const create = useCreateQuote()
  const issue = useIssueQuote()

  const [clientCompany, setClientCompany] = useState('')
  const [lines, setLines] = useState<QuoteLine[]>([])
  const keySeq = useRef(0)
  const restored = useRef(false)
  const nextKey = () => `l${keySeq.current++}`

  const grouped = useMemo(() => {
    const map = new Map<QuoteCategory, ActiveCatalogItem[]>()
    for (const c of catalog ?? []) {
      const arr = map.get(c.category) ?? []
      arr.push(c)
      map.set(c.category, arr)
    }
    return map
  }, [catalog])

  // 임시저장본 복원(카탈로그+초안 모두 로드된 뒤 1회).
  useEffect(() => {
    if (restored.current || draftId == null || !draft || !catalog) return
    setClientCompany(draft.clientCompanyName ?? '')
    const restoredLines: QuoteLine[] = [...draft.items]
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((it) => {
        if (it.catalogId != null) {
          const c = catalog.find((x) => x.id === it.catalogId)
          const isCustom = c?.priceType === 'CUSTOM'
          return {
            key: nextKey(),
            catalogId: it.catalogId,
            itemName: it.itemName,
            unitPrice: it.unitPrice,
            quantity: it.quantity,
            days: it.days,
            priceEditable: isCustom,
            nameEditable: false,
          }
        }
        return {
          key: nextKey(),
          catalogId: null,
          itemName: it.itemName,
          unitPrice: it.unitPrice,
          quantity: it.quantity,
          days: it.days,
          priceEditable: true,
          nameEditable: true,
        }
      })
    setLines(restoredLines)
    restored.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId, draft, catalog])

  function addCatalog(c: ActiveCatalogItem) {
    const isCustom = c.priceType === 'CUSTOM'
    setLines((prev) => [
      ...prev,
      {
        key: nextKey(),
        catalogId: c.id,
        itemName: c.itemName,
        unitPrice: isCustom ? 0 : c.unitPrice,
        quantity: 1,
        days: 1,
        priceEditable: isCustom,
        nameEditable: false,
      },
    ])
  }

  function addCustom() {
    setLines((prev) => [
      ...prev,
      {
        key: nextKey(),
        catalogId: null,
        itemName: '',
        unitPrice: 0,
        quantity: 1,
        days: 1,
        priceEditable: true,
        nameEditable: true,
      },
    ])
  }

  function patchLine(key: string, patch: Partial<QuoteLine>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  }
  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key))
  }

  // 금액 분해(라인합 → 기업이윤 10% → 공급가액 → VAT 10% → 합계). 백엔드와 동일 공식.
  const breakdown = useMemo(() => {
    const subtotalSum = lines.reduce((s, l) => s + l.unitPrice * l.quantity * l.days, 0)
    const companyProfit = Math.round(subtotalSum * 0.1)
    const supplyAmount = subtotalSum + companyProfit
    const vat = Math.round(supplyAmount * 0.1)
    const total = supplyAmount + vat
    return { subtotalSum, companyProfit, supplyAmount, vat, total }
  }, [lines])

  const lineValid = (l: QuoteLine) =>
    l.quantity >= 1 && l.days >= 1 && (!l.nameEditable || l.itemName.trim().length > 0) && l.unitPrice >= 0
  const canSubmit = lines.length > 0 && lines.every(lineValid)

  function buildPayload(): QuoteItemPayload[] {
    return lines.map((l) =>
      l.catalogId != null
        ? {
            catalogId: l.catalogId,
            quantity: l.quantity,
            days: l.days,
            ...(l.priceEditable ? { unitPrice: l.unitPrice } : {}),
          }
        : { itemName: l.itemName.trim(), unitPrice: l.unitPrice, quantity: l.quantity, days: l.days },
    )
  }

  async function handleSaveDraft() {
    try {
      await create.mutateAsync({ clientCompanyName: clientCompany.trim() || null, items: buildPayload() })
      toast.success('임시저장되었습니다.')
      navigate('/partner/quotes')
    } catch (err) {
      toast.error(toApiError(err).message)
    }
  }

  async function handleIssue() {
    if (!clientCompany.trim()) {
      toast.error('발급하려면 발주처(고객사명)를 입력하세요.')
      return
    }
    try {
      const quote = await create.mutateAsync({
        clientCompanyName: clientCompany.trim(),
        items: buildPayload(),
      })
      const blob = await issue.mutateAsync(quote.id)
      saveBlob(blob, `quote-${quote.id}.pdf`)
      toast.success('견적서 발급 완료')
      navigate('/partner/quotes')
    } catch (err) {
      toast.error(toApiError(err).message)
    }
  }

  const busy = create.isPending || issue.isPending

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3 text-white">
        <h1 className="text-3xl font-bold">모의 견적 작성</h1>
        <button
          onClick={() => navigate('/partner/quotes')}
          className="rounded-lg bg-white/15 px-3 py-2 text-sm font-medium text-white hover:bg-white/25"
        >
          내 견적 목록
        </button>
      </div>

      {draftId != null && (
        <div className="mb-4 rounded-lg bg-white/90 px-4 py-2.5 text-sm text-ink-700">
          임시저장본을 불러왔습니다. 저장/발급하면 <b>새 견적</b>으로 생성됩니다(원본 임시저장본은 유지).
        </div>
      )}

      {/* 발주처 */}
      <div className="mb-4 rounded-2xl bg-white p-5 shadow-card">
        <label className="field-label">
          발주처 (고객사명) <span className="text-red-500">*</span>
        </label>
        <input
          value={clientCompany}
          onChange={(e) => setClientCompany(e.target.value)}
          placeholder="견적을 받을 고객사명 (발급 시 필수)"
          className="h-10 w-full max-w-md rounded-lg border border-ink-200 bg-white px-3 text-[15px] text-ink-900 placeholder:text-ink-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* 좌: 카탈로그 */}
        <div className="rounded-2xl bg-white p-6 shadow-card lg:col-span-5">
          <h2 className="mb-4 text-lg font-semibold text-ink-900">활성 카탈로그</h2>
          {catalogLoading ? (
            <div className="py-12">
              <Spinner label="불러오는 중..." />
            </div>
          ) : (catalog?.length ?? 0) === 0 ? (
            <p className="py-8 text-center text-sm text-ink-500">등록된 품목이 없습니다.</p>
          ) : (
            <div className="space-y-6">
              {QUOTE_CATEGORIES.filter((cat) => grouped.has(cat.value)).map((cat) => (
                <section key={cat.value}>
                  <h3 className="mb-2 text-sm font-semibold text-brand-700">{cat.label}</h3>
                  <div className="space-y-2">
                    {grouped.get(cat.value)!.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-ink-200 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[15px] font-medium text-ink-900">
                            {item.itemName}
                          </p>
                          <p className="text-xs text-ink-500">
                            {item.priceType === 'CUSTOM'
                              ? `입력형 · ${item.unit}`
                              : `${formatWon(item.unitPrice)} / ${item.unit}`}
                          </p>
                        </div>
                        <button
                          onClick={() => addCatalog(item)}
                          className="shrink-0 rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-100"
                        >
                          + 추가
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        {/* 우: 견적 라인 */}
        <div className="rounded-2xl bg-white p-6 shadow-card lg:col-span-7">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink-900">견적 내역</h2>
            <button
              onClick={addCustom}
              className="rounded-lg border border-ink-200 px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-ink-50"
            >
              + 기타 항목
            </button>
          </div>

          {lines.length === 0 ? (
            <p className="rounded-lg border border-dashed border-ink-300 py-12 text-center text-sm text-ink-500">
              왼쪽 카탈로그에서 품목을 추가하세요.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-brand-100">
                <table className="w-full text-sm">
                  <thead className="bg-brand-50 text-brand-800">
                    <tr>
                      <th className="px-2 py-2 text-center">#</th>
                      <th className="px-2 py-2 text-left">품명</th>
                      <th className="px-2 py-2 text-right">단가</th>
                      <th className="px-2 py-2 text-center">수량</th>
                      <th className="px-2 py-2 text-center">일수</th>
                      <th className="px-2 py-2 text-right">소계</th>
                      <th className="px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l, i) => (
                      <tr key={l.key} className="border-t border-ink-100">
                        <td className="px-2 py-2 text-center text-ink-500">{i + 1}</td>
                        <td className="px-2 py-2">
                          {l.nameEditable ? (
                            <input
                              value={l.itemName}
                              onChange={(e) => patchLine(l.key, { itemName: e.target.value })}
                              placeholder="품명 입력"
                              className="w-full rounded border border-ink-200 px-2 py-1 text-[13px] focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-400"
                            />
                          ) : (
                            <span className="text-ink-900">{l.itemName}</span>
                          )}
                        </td>
                        <td className="px-2 py-2 text-right">
                          {l.priceEditable ? (
                            <input
                              inputMode="numeric"
                              value={l.unitPrice ? l.unitPrice.toLocaleString('ko-KR') : ''}
                              onChange={(e) =>
                                patchLine(l.key, {
                                  unitPrice: Number(e.target.value.replace(/[^\d]/g, '')) || 0,
                                })
                              }
                              placeholder="0"
                              className="w-24 rounded border border-ink-200 px-2 py-1 text-right text-[13px] focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-400"
                            />
                          ) : (
                            <span className="text-ink-700">{formatWon(l.unitPrice)}</span>
                          )}
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => patchLine(l.key, { quantity: Math.max(1, l.quantity - 1) })}
                              className="h-6 w-6 rounded border border-ink-200 text-ink-600 hover:bg-ink-50"
                            >
                              −
                            </button>
                            <input
                              inputMode="numeric"
                              value={l.quantity}
                              onChange={(e) =>
                                patchLine(l.key, {
                                  quantity: Math.max(1, Number(e.target.value.replace(/[^\d]/g, '')) || 1),
                                })
                              }
                              className="w-10 rounded border border-ink-200 px-1 py-1 text-center text-[13px] focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-400"
                            />
                            <button
                              onClick={() => patchLine(l.key, { quantity: l.quantity + 1 })}
                              className="h-6 w-6 rounded border border-ink-200 text-ink-600 hover:bg-ink-50"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <input
                            inputMode="numeric"
                            value={l.days}
                            onChange={(e) =>
                              patchLine(l.key, {
                                days: Math.max(1, Number(e.target.value.replace(/[^\d]/g, '')) || 1),
                              })
                            }
                            className="mx-auto block w-12 rounded border border-ink-200 px-1 py-1 text-center text-[13px] focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-400"
                          />
                        </td>
                        <td className="px-2 py-2 text-right font-medium text-ink-900">
                          {formatWon(l.unitPrice * l.quantity * l.days)}
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button
                            onClick={() => removeLine(l.key)}
                            className="text-ink-400 hover:text-red-600"
                            aria-label="삭제"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 금액 분해 */}
              <div className="mt-4 ml-auto w-full max-w-xs space-y-1.5 text-sm">
                <SummaryRow label="라인합" value={breakdown.subtotalSum} />
                <SummaryRow label="기업이윤 (10%)" value={breakdown.companyProfit} />
                <SummaryRow label="공급가액" value={breakdown.supplyAmount} />
                <SummaryRow label="부가세 (10%)" value={breakdown.vat} />
                <div className="flex justify-between border-t-2 border-t-brand-500 pt-2">
                  <span className="font-semibold text-ink-800">합계 (VAT 포함)</span>
                  <span className="text-lg font-bold text-brand-700">{formatWon(breakdown.total)}</span>
                </div>
              </div>
            </>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={handleSaveDraft}
              disabled={!canSubmit || busy}
              className="rounded-lg border border-ink-300 px-5 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              임시저장
            </button>
            <button
              onClick={handleIssue}
              disabled={!canSubmit || busy}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-ink-400"
            >
              {busy && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              견적 발급
            </button>
          </div>
        </div>
      </div>
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
