import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toApiError } from '@/api/client'
import { toast } from '@/store/toastStore'
import { useMaterials } from '@/features/admin/materials/hooks/useMaterials'
import type { ProposalIdeaPayload, ProposalMaterialRef } from '@/types/proposal'
import { Markdown } from './components/Markdown'
import { RelatedMaterialBadges } from './components/RelatedMaterialBadges'
import { AnalyzingIndicator } from './components/AnalyzingIndicator'
import { analyzeErrorMessage } from './lib/errors'
import { useAnalyzeProposal } from './hooks/useAnalyzeProposal'
import { useCreateProposal } from './hooks/useProposalMutations'

export function ProposalNewPage() {
  const navigate = useNavigate()
  const analyze = useAnalyzeProposal()
  const create = useCreateProposal()
  // 관련 자료 id → 제목 해석용(분석 응답은 id만 내려줌).
  const { data: materials } = useMaterials({})

  const [companyName, setCompanyName] = useState('')
  const [analyzed, setAnalyzed] = useState(false)
  const [companyAnalysis, setCompanyAnalysis] = useState('')
  const [ideas, setIdeas] = useState<ProposalIdeaPayload[]>([])

  const titleById = useMemo(() => {
    const map = new Map<number, string>()
    materials?.forEach((m) => map.set(m.id, m.title))
    return map
  }, [materials])

  function resolveRefs(ids: number[]): ProposalMaterialRef[] {
    return ids
      .map((id) => (titleById.has(id) ? { id, title: titleById.get(id)! } : null))
      .filter((r): r is ProposalMaterialRef => r !== null)
  }

  function runAnalyze() {
    const name = companyName.trim()
    if (!name) return
    analyze.mutate(name, {
      onSuccess: (res) => {
        setCompanyAnalysis(res.companyAnalysis)
        setIdeas(res.ideas)
        setAnalyzed(true)
        toast.success('AI 분석이 완료되었습니다. 내용을 확인 후 저장하세요.')
      },
      onError: (err) => toast.error(analyzeErrorMessage(err)),
    })
  }

  function updateIdea(index: number, patch: Partial<ProposalIdeaPayload>) {
    setIdeas((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)))
  }

  const canSave =
    companyName.trim() &&
    companyAnalysis.trim() &&
    ideas.length > 0 &&
    ideas.every((it) => it.title.trim() && it.description.trim())

  function runSave() {
    create.mutate(
      {
        targetCompanyName: companyName.trim(),
        companyAnalysis: companyAnalysis.trim(),
        ideas: ideas.map((it) => ({
          title: it.title.trim(),
          description: it.description.trim(),
          relatedMaterialIds: it.relatedMaterialIds,
        })),
      },
      {
        onSuccess: () => {
          toast.success('협업 아이디어가 저장되었습니다.')
          navigate('/admin/proposals')
        },
        onError: (err) => toast.error(toApiError(err).message),
      },
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate('/admin/proposals')}
          className="text-sm text-ink-500 hover:text-ink-800"
        >
          ← 목록
        </button>
        <h1 className="text-[22px] font-semibold text-ink-900">새 협업 아이디어 추천</h1>
      </div>

      {/* 입력 카드 */}
      <Card className="mb-5">
        <CardHeader
          title="후보 기업 분석"
          subtitle="협업 후보 기업명을 입력하면 AI가 기업을 조사하고 협업 아이디어를 추천합니다."
          icon="🏢"
        />
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Input
              label="협업 후보 기업명"
              placeholder="예: ○○회사"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !analyze.isPending) runAnalyze()
              }}
              disabled={analyze.isPending}
            />
          </div>
          <Button disabled={!companyName.trim()} loading={analyze.isPending} onClick={runAnalyze}>
            AI 분석
          </Button>
        </div>
        {analyze.isPending && <AnalyzingIndicator />}
      </Card>

      {/* 결과 패널 — 좌(기업분석) 5 : 우(아이디어) 7 */}
      {analyzed && (
        <div className="grid gap-5 lg:grid-cols-12">
          {/* 좌: 기업 분석 */}
          <Card className="lg:col-span-5">
            <CardHeader title="기업 분석" icon="📊" />
            <Markdown>{companyAnalysis}</Markdown>
          </Card>

          {/* 우: 협업 아이디어(편집 가능) */}
          <div className="space-y-4 lg:col-span-7">
            <div className="flex items-center justify-between">
              <h2 className="text-[17px] font-semibold text-ink-900">협업 아이디어</h2>
              <span className="text-xs text-ink-500">제목·설명을 다듬어 저장하세요</span>
            </div>
            {ideas.map((idea, i) => (
              <div
                key={i}
                className="rounded-xl border-l-4 border-brand-500 bg-white p-5 shadow-card"
              >
                <Input
                  value={idea.title}
                  onChange={(e) => updateIdea(i, { title: e.target.value })}
                  placeholder={`아이디어 ${i + 1} 제목`}
                  className="font-semibold"
                />
                <textarea
                  value={idea.description}
                  onChange={(e) => updateIdea(i, { description: e.target.value })}
                  rows={3}
                  placeholder="아이디어 설명"
                  className="mt-2 w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-[15px] text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                />
                <div className="mt-3">
                  <p className="mb-1.5 text-xs font-medium text-ink-500">관련 자료</p>
                  <RelatedMaterialBadges materials={resolveRefs(idea.relatedMaterialIds)} />
                </div>
              </div>
            ))}

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" onClick={() => setAnalyzed(false)}>
                다시 분석
              </Button>
              <Button disabled={!canSave} loading={create.isPending} onClick={runSave}>
                저장
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
