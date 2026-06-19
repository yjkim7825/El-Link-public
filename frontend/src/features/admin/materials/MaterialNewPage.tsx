import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { DropZone } from '@/components/ui/DropZone'
import { cn } from '@/lib/cn'
import { categorySuggestions } from '@/lib/categories'
import { aiErrorMessage } from '@/lib/aiError'
import { toApiError } from '@/api/client'
import { toast } from '@/store/toastStore'
import { MATERIAL_CATEGORIES, type MaterialFileRef } from '@/types/material'
import { useAnalyzeMaterial } from './hooks/useAnalyzeMaterial'
import { useMaterialCategories } from './hooks/useMaterialCategories'
import { useCreateMaterial } from './hooks/useMaterialMutations'

const MAX_BYTES = 10 * 1024 * 1024 // 10MB (분석 파일)
const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5MB (대표 이미지)
type Tab = 'file' | 'text'

export function MaterialNewPage() {
  const navigate = useNavigate()
  const analyze = useAnalyzeMaterial()
  const create = useCreateMaterial()

  const [tab, setTab] = useState<Tab>('file')
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState('')
  // 대표 이미지(선택) — 두 탭 공통. 텍스트 탭에선 AI 분석에도 함께 전달됨.
  const [repImage, setRepImage] = useState<File | null>(null)
  const [repPreview, setRepPreview] = useState<string | null>(null)

  // 분석 결과(편집 가능) + 저장할 파일 메타
  const [analyzed, setAnalyzed] = useState(false)
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [category, setCategory] = useState('')
  const [keywords, setKeywords] = useState('')
  const [savedFile, setSavedFile] = useState<MaterialFileRef | null>(null)
  const [savedThumbnail, setSavedThumbnail] = useState<MaterialFileRef | null>(null)

  // 대표 이미지 로컬 미리보기
  useEffect(() => {
    if (!repImage) {
      setRepPreview(null)
      return
    }
    const url = URL.createObjectURL(repImage)
    setRepPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [repImage])

  const canAnalyze = tab === 'file' ? !!file : text.trim().length > 0
  const canSave = title.trim() && summary.trim() && category.trim()

  function runAnalyze() {
    analyze.mutate(
      {
        file: tab === 'file' ? file : null,
        text: tab === 'text' ? text : undefined,
        representativeImage: repImage,
      },
      {
        onSuccess: (res) => {
          setTitle(res.analysis.title ?? '')
          setSummary(res.analysis.introduction ?? '')
          setCategory(res.analysis.category ?? '')
          setKeywords(res.analysis.keywords ?? '')
          setSavedFile(res.file)
          setSavedThumbnail(res.thumbnail)
          setAnalyzed(true)
          toast.success('AI 분석이 완료되었습니다. 내용을 확인 후 저장하세요.')
        },
        onError: (err) => toast.error(aiErrorMessage(err)),
      },
    )
  }

  function runSave() {
    create.mutate(
      {
        title: title.trim(),
        summary: summary.trim(),
        category: category.trim(),
        keywords: keywords.trim() || null,
        thumbnailFileKey: savedThumbnail?.fileKey ?? null,
        files: savedFile ? [savedFile] : [],
      },
      {
        onSuccess: () => {
          toast.success('자료가 저장되었습니다.')
          navigate('/admin/materials')
        },
        onError: (err) => toast.error(toApiError(err).message),
      },
    )
  }

  // 카테고리는 자유 입력. AI 추천 4종 + 기존 데이터 카테고리를 자동완성 제안으로 노출.
  const existingCategories = useMaterialCategories()
  const suggestions = categorySuggestions(MATERIAL_CATEGORIES, existingCategories)

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate('/admin/materials')}
          className="text-sm text-ink-500 hover:text-ink-800"
        >
          ← 목록
        </button>
        <h1 className="text-[22px] font-semibold text-ink-900">새 자료 분석</h1>
      </div>

      {/* 입력 카드 */}
      <Card className="mb-5">
        <CardHeader title="자료 업로드" subtitle="파일 또는 텍스트를 업로드하면 AI가 분석합니다." icon="📂" />

        <div className="mb-5 flex gap-4 border-b border-ink-200">
          {(['file', 'text'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'border-b-[3px] px-1 pb-2.5 text-[15px] font-medium transition-colors',
                tab === t
                  ? 'border-brand-500 font-semibold text-brand-600'
                  : 'border-transparent text-ink-500 hover:text-ink-800',
              )}
            >
              {t === 'file' ? '파일 업로드' : '텍스트 입력'}
            </button>
          ))}
        </div>

        {tab === 'file' ? (
          <DropZone
            file={file}
            onFile={setFile}
            accept="image/*,application/pdf,.doc,.docx"
            maxBytes={MAX_BYTES}
            onError={(m) => toast.error(m)}
            hint="PDF · DOCX · 이미지 (최대 10MB)"
          />
        ) : (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder="여기에 분석할 내용을 입력하세요..."
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-[15px] text-ink-900 placeholder:text-ink-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          />
        )}

        {/* 대표 이미지(선택) — 두 탭 공통 */}
        <div className="mt-5">
          <label className="field-label">
            대표 이미지 (선택){tab === 'text' && ' · 분석에도 함께 사용됩니다'}
          </label>
          {repPreview ? (
            <div className="flex items-center gap-4">
              <img
                src={repPreview}
                alt="대표 이미지 미리보기"
                className="h-24 w-40 rounded-lg border border-ink-200 object-cover"
              />
              <button
                onClick={() => setRepImage(null)}
                className="text-sm font-medium text-red-600 hover:underline"
              >
                제거
              </button>
            </div>
          ) : (
            <DropZone
              file={null}
              onFile={setRepImage}
              accept="image/*"
              maxBytes={MAX_IMAGE_BYTES}
              onError={(m) => toast.error(m)}
              hint="포트폴리오 카드에 표시될 이미지 (최대 5MB)"
            />
          )}
        </div>

        <div className="mt-5">
          {analyze.isPending ? (
            <div className="py-2">
              <Spinner label="AI가 분석 중입니다..." />
            </div>
          ) : (
            <Button block size="lg" disabled={!canAnalyze} onClick={runAnalyze}>
              AI 분석
            </Button>
          )}
        </div>
      </Card>

      {/* 결과 카드 */}
      {analyzed && (
        <Card>
          <CardHeader title="분석 결과" subtitle="내용을 검토·수정한 뒤 저장하세요." icon="🤖" />
          <div className="grid gap-5 lg:grid-cols-2">
            {/* 좌: 대표 이미지 + 기본 메타 */}
            <div className="space-y-4">
              {repPreview && (
                <div>
                  <label className="field-label">대표 이미지</label>
                  <img
                    src={repPreview}
                    alt="대표 이미지"
                    className="aspect-video w-full rounded-lg border border-ink-200 object-cover"
                  />
                </div>
              )}
              <Input label="제목" value={title} onChange={(e) => setTitle(e.target.value)} />
              <div>
                <Input
                  label="카테고리"
                  list="material-category-suggestions"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="환경 교육 · 체험 · 봉사 · 업사이클링 (직접 입력 가능)"
                />
                <datalist id="material-category-suggestions">
                  {suggestions.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                <p className="mt-1 text-xs text-ink-400">AI 추천값은 자동완성으로 제안되며, 새 카테고리도 직접 입력할 수 있어요.</p>
              </div>
              <Input
                label="키워드 (콤마로 구분)"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="ESG 경영, 자원순환, 친환경"
              />
              {savedFile && (
                <p className="text-xs text-ink-500">📎 첨부: {savedFile.originalName}</p>
              )}
            </div>

            {/* 우: 요약(넓은 폭 활용) */}
            <div className="flex flex-col">
              <label className="field-label">요약</label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="min-h-[220px] w-full flex-1 rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-[15px] leading-relaxed text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 lg:min-h-full"
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2 border-t border-ink-100 pt-4">
            <Button variant="secondary" onClick={() => setAnalyzed(false)}>
              다시 분석
            </Button>
            <Button disabled={!canSave} loading={create.isPending} onClick={runSave}>
              저장
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
