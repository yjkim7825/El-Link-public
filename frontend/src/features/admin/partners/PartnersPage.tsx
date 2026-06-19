import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Table, THead, Th, Td } from '@/components/ui/Table'
import { formatDate } from '@/lib/formatters'
import { toApiError } from '@/api/client'
import { toast } from '@/store/toastStore'
import type { PartnerStatus, PartnerSummary } from '@/types/partner'
import { PartnerStatusBadge } from './components/PartnerStatusBadge'
import { CreatePartnerModal } from './components/CreatePartnerModal'
import { usePartners } from './hooks/usePartners'
import { useUpdatePartnerStatus } from './hooks/usePartnerMutations'

type StatusToggle = { partner: PartnerSummary; next: Extract<PartnerStatus, 'ACTIVE' | 'DISABLED'> }

export function PartnersPage() {
  const [status, setStatus] = useState<PartnerStatus | ''>('')
  const [keyword, setKeyword] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [toggle, setToggle] = useState<StatusToggle | null>(null)

  const { data, isLoading, isError } = usePartners({ status, keyword })
  const updateStatus = useUpdatePartnerStatus()

  function confirmToggle() {
    if (!toggle) return
    updateStatus.mutate(
      { id: toggle.partner.id, status: toggle.next },
      {
        onSuccess: () => {
          toast.success(toggle.next === 'ACTIVE' ? '활성화되었습니다.' : '비활성화되었습니다.')
          setToggle(null)
        },
        onError: (err) => {
          toast.error(toApiError(err).message)
          setToggle(null)
        },
      },
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-ink-900">파트너 관리</h1>
          <p className="mt-1 text-sm text-ink-500">협업 기업 담당자 계정을 등록·관리합니다.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>+ 새 파트너 등록</Button>
      </div>

      {/* 필터 */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-44">
          <Select
            label="상태"
            value={status}
            onChange={(e) => setStatus(e.target.value as PartnerStatus | '')}
          >
            <option value="">전체</option>
            <option value="ACTIVE">활성</option>
            <option value="DISABLED">비활성</option>
            <option value="INVITED">초대됨</option>
          </Select>
        </div>
        <div className="w-72">
          <Input
            label="검색"
            placeholder="회사명·담당자명·이메일"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
      </div>

      {isLoading && (
        <div className="py-16">
          <Spinner label="불러오는 중..." />
        </div>
      )}
      {isError && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          목록을 불러오지 못했습니다.
        </div>
      )}

      {data &&
        (data.length === 0 ? (
          <EmptyState
            icon="👥"
            title="파트너가 없습니다"
            description={
              status || keyword ? '조건에 맞는 파트너가 없습니다.' : '새 파트너를 등록해보세요.'
            }
            action={
              !status && !keyword ? (
                <Button onClick={() => setCreateOpen(true)}>+ 새 파트너 등록</Button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-hidden rounded-xl bg-white p-2 shadow-card">
            <Table>
              <THead>
                <tr>
                  <Th align="left">회사명</Th>
                  <Th align="left">담당자명</Th>
                  <Th align="left">이메일</Th>
                  <Th>상태</Th>
                  <Th>마지막 로그인</Th>
                  <Th>가입일</Th>
                  <Th>액션</Th>
                </tr>
              </THead>
              <tbody>
                {data.map((p) => {
                  const next: StatusToggle['next'] = p.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
                  return (
                    <tr key={p.id} className="hover:bg-ink-50">
                      <Td align="left">
                        <span className="font-medium text-ink-900">{p.companyName}</span>
                      </Td>
                      <Td align="left" className="text-ink-700">
                        {p.contactName}
                      </Td>
                      <Td align="left" className="text-ink-600">
                        {p.email}
                      </Td>
                      <Td align="center">
                        <PartnerStatusBadge status={p.status} />
                      </Td>
                      <Td align="center" className="whitespace-nowrap text-ink-600">
                        {p.lastLoginAt ? formatDate(p.lastLoginAt) : '-'}
                      </Td>
                      <Td align="center" className="whitespace-nowrap text-ink-600">
                        {formatDate(p.createdAt)}
                      </Td>
                      <Td align="center" className="whitespace-nowrap">
                        <button
                          onClick={() => setToggle({ partner: p, next })}
                          className={
                            next === 'DISABLED'
                              ? 'text-sm font-medium text-red-600 hover:underline'
                              : 'text-sm font-medium text-brand-600 hover:underline'
                          }
                        >
                          {next === 'DISABLED' ? '비활성화' : '활성화'}
                        </button>
                      </Td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          </div>
        ))}

      <CreatePartnerModal open={createOpen} onClose={() => setCreateOpen(false)} />

      <ConfirmDialog
        open={!!toggle}
        title={toggle?.next === 'DISABLED' ? '파트너를 비활성화할까요?' : '파트너를 활성화할까요?'}
        description={
          toggle ? (
            <>
              <span className="font-medium text-ink-800">{toggle.partner.companyName}</span>{' '}
              {toggle.next === 'DISABLED'
                ? '계정을 비활성화하면 해당 파트너는 로그인할 수 없습니다.'
                : '계정을 활성화하면 해당 파트너가 다시 로그인할 수 있습니다.'}
            </>
          ) : undefined
        }
        confirmLabel={toggle?.next === 'DISABLED' ? '비활성화' : '활성화'}
        danger={toggle?.next === 'DISABLED'}
        loading={updateStatus.isPending}
        onConfirm={confirmToggle}
        onCancel={() => setToggle(null)}
      />
    </div>
  )
}
