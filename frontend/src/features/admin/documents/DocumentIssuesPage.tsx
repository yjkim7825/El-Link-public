import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Table, THead, Th, Td } from '@/components/ui/Table'
import { formatDateTime } from '@/lib/formatters'
import { usePartners } from '@/features/admin/partners/hooks/usePartners'
import { DocTypeBadge } from './components/DocTypeBadge'
import { useDocumentIssues } from './hooks/useDocumentIssues'

/** 날짜(yyyy-MM-dd) → KST 기준 ISO instant. end=true면 그날 끝(23:59:59). */
function toIso(date: string, end = false): string | undefined {
  if (!date) return undefined
  return `${date}T${end ? '23:59:59' : '00:00:00'}+09:00`
}

export function DocumentIssuesPage() {
  const navigate = useNavigate()
  const [partnerId, setPartnerId] = useState<number | ''>('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const { data: partners } = usePartners({})
  const filters = useMemo(
    () => ({ partnerId, from: toIso(from), to: toIso(to, true) }),
    [partnerId, from, to],
  )
  const { data, isLoading, isError } = useDocumentIssues(filters)

  // 최신순 정렬(서버 정렬에 의존하지 않도록 클라에서도 보장).
  const rows = useMemo(
    () => [...(data ?? [])].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt)),
    [data],
  )

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate('/admin/documents')}
          className="text-sm text-ink-500 hover:text-ink-800"
        >
          ← 서류 관리
        </button>
        <h1 className="text-[22px] font-semibold text-ink-900">발급 이력</h1>
      </div>

      {/* 필터 */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-56">
          <Select
            label="파트너"
            value={partnerId}
            onChange={(e) => setPartnerId(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">전체</option>
            {partners?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.companyName} ({p.contactName})
              </option>
            ))}
          </Select>
        </div>
        <div className="w-40">
          <Input label="시작일" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="w-40">
          <Input label="종료일" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        {(partnerId || from || to) && (
          <Button
            variant="ghost"
            onClick={() => {
              setPartnerId('')
              setFrom('')
              setTo('')
            }}
          >
            초기화
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="py-16">
          <Spinner label="불러오는 중..." />
        </div>
      )}
      {isError && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          이력을 불러오지 못했습니다.
        </div>
      )}

      {data &&
        (rows.length === 0 ? (
          <EmptyState
            icon="🧾"
            title="발급 이력이 없습니다"
            description="파트너가 서류를 다운로드하면 이력이 기록됩니다."
          />
        ) : (
          <div className="overflow-hidden rounded-xl bg-white p-2 shadow-card">
            <Table>
              <THead>
                <tr>
                  <Th align="left">발급일시</Th>
                  <Th align="left">파트너</Th>
                  <Th align="left">문서</Th>
                </tr>
              </THead>
              <tbody>
                {rows.map((it) => (
                  <tr key={it.id} className="hover:bg-ink-50">
                    <Td align="left" className="whitespace-nowrap text-ink-700">
                      {formatDateTime(it.issuedAt)}
                    </Td>
                    <Td align="left">
                      <span className="font-medium text-ink-900">{it.partnerCompanyName}</span>
                      <span className="ml-1.5 text-ink-500">{it.partnerContactName}</span>
                    </Td>
                    <Td align="left">
                      <div className="flex items-center gap-2">
                        <DocTypeBadge type={it.documentType} />
                        <span className="text-ink-800">{it.documentTitle}</span>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        ))}
    </div>
  )
}
