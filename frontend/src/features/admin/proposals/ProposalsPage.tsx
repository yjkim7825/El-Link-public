import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Table, THead, Th, Td } from '@/components/ui/Table'
import { formatDate } from '@/lib/formatters'
import { toApiError } from '@/api/client'
import { toast } from '@/store/toastStore'
import type { ProposalListItem } from '@/types/proposal'
import { useProposals } from './hooks/useProposals'
import { useDeleteProposal } from './hooks/useProposalMutations'

export function ProposalsPage() {
  const navigate = useNavigate()
  const { data, isLoading, isError } = useProposals()
  const del = useDeleteProposal()
  const [target, setTarget] = useState<ProposalListItem | null>(null)

  function confirmDelete() {
    if (!target) return
    del.mutate(target.id, {
      onSuccess: () => {
        toast.success('협업 아이디어가 삭제되었습니다.')
        setTarget(null)
      },
      onError: (err) => {
        toast.error(toApiError(err).message)
        setTarget(null)
      },
    })
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-ink-900">협업 아이디어 추천</h1>
          <p className="mt-1 text-sm text-ink-500">기업 분석 + 보유 자료 매칭으로 협업 아이디어를 도출합니다.</p>
        </div>
        <Button onClick={() => navigate('/admin/proposals/new')}>+ 새 협업 아이디어 추천</Button>
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
            icon="🤝"
            title="등록된 협업 아이디어가 없습니다"
            description="후보 기업을 입력해 첫 협업 아이디어를 추천받아보세요."
            action={
              <Button onClick={() => navigate('/admin/proposals/new')}>+ 새 협업 아이디어 추천</Button>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-xl bg-white p-2 shadow-card">
            <Table>
              <THead>
                <tr>
                  <Th align="left">대상 기업명</Th>
                  <Th>아이디어 수</Th>
                  <Th>작성일</Th>
                  <Th>액션</Th>
                </tr>
              </THead>
              <tbody>
                {data.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/admin/proposals/${p.id}`)}
                    className="cursor-pointer hover:bg-ink-50"
                  >
                    <Td align="left">
                      <span className="font-medium text-ink-900">{p.targetCompanyName}</span>
                    </Td>
                    <Td align="center" className="text-ink-700">
                      {p.ideaCount}
                    </Td>
                    <Td align="center" className="whitespace-nowrap text-ink-600">
                      {formatDate(p.createdAt)}
                    </Td>
                    <Td align="center" className="whitespace-nowrap">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/admin/proposals/${p.id}`)
                          }}
                          className="text-sm font-medium text-brand-600 hover:underline"
                        >
                          보기
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setTarget(p)
                          }}
                          className="text-sm font-medium text-red-600 hover:underline"
                        >
                          삭제
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        ))}

      <ConfirmDialog
        open={!!target}
        title="협업 아이디어를 삭제할까요?"
        description={
          target ? (
            <>
              <span className="font-medium text-ink-800">{target.targetCompanyName}</span>에 대한 협업
              아이디어 추천이 모두 삭제되며 되돌릴 수 없습니다.
            </>
          ) : undefined
        }
        confirmLabel="삭제"
        danger
        loading={del.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setTarget(null)}
      />
    </div>
  )
}
