import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatDate } from '@/lib/formatters'
import { toApiError } from '@/api/client'
import { toast } from '@/store/toastStore'
import { Markdown } from './components/Markdown'
import { RelatedMaterialBadges } from './components/RelatedMaterialBadges'
import { useProposal } from './hooks/useProposal'
import { useDeleteProposal } from './hooks/useProposalMutations'

export function ProposalDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const proposalId = Number(id)
  const { data, isLoading, isError } = useProposal(proposalId)
  const del = useDeleteProposal()
  const [confirmOpen, setConfirmOpen] = useState(false)

  function handleDelete() {
    del.mutate(proposalId, {
      onSuccess: () => {
        toast.success('협업 아이디어가 삭제되었습니다.')
        navigate('/admin/proposals')
      },
      onError: (err) => {
        setConfirmOpen(false)
        toast.error(toApiError(err).message)
      },
    })
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/proposals')}
            className="text-sm text-ink-500 hover:text-ink-800"
          >
            ← 목록
          </button>
          <h1 className="text-[22px] font-semibold text-ink-900">협업 아이디어 추천 상세</h1>
        </div>
        {data && (
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>
            삭제
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
          협업 아이디어 추천을 찾을 수 없습니다.
        </div>
      )}

      {data && (
        <>
          <Card className="mb-5">
            <CardHeader
              title={data.targetCompanyName}
              subtitle={`작성자 ${data.createdByName} · ${formatDate(data.createdAt)}`}
              icon="🏢"
            />
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader title="기업 분석" icon="📊" />
              <Markdown>{data.companyAnalysis}</Markdown>
            </Card>

            <div className="space-y-4">
              <h2 className="text-[17px] font-semibold text-ink-900">협업 아이디어</h2>
              {data.ideas.map((idea) => (
                <div
                  key={idea.id}
                  className="rounded-xl border-l-4 border-brand-500 bg-white p-5 shadow-card"
                >
                  <h3 className="text-[16px] font-semibold text-ink-900">{idea.title}</h3>
                  <p className="mt-1.5 whitespace-pre-wrap text-[15px] text-ink-700">
                    {idea.description}
                  </p>
                  <div className="mt-3">
                    <p className="mb-1.5 text-xs font-medium text-ink-500">관련 자료</p>
                    <RelatedMaterialBadges materials={idea.relatedMaterials} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <ConfirmDialog
            open={confirmOpen}
            title="협업 아이디어를 삭제할까요?"
            description="아이디어까지 함께 삭제되며 되돌릴 수 없습니다."
            confirmLabel="삭제"
            danger
            loading={del.isPending}
            onConfirm={handleDelete}
            onCancel={() => setConfirmOpen(false)}
          />
        </>
      )}
    </div>
  )
}
