import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { AuthImage } from '@/components/ui/AuthImage'
import { formatDate, formatNumber } from '@/lib/formatters'
import { splitKeywords } from '@/lib/keywords'
import { toApiError } from '@/api/client'
import { toast } from '@/store/toastStore'
import { downloadMaterialFile } from '@/api/materials'
import { CategoryBadge } from './components/CategoryBadge'
import { CategoryThumb } from './components/CategoryThumb'
import { useMaterial } from './hooks/useMaterial'
import { useDeleteMaterial } from './hooks/useMaterialMutations'

export function MaterialDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const materialId = Number(id)
  const { data, isLoading, isError } = useMaterial(materialId)
  const del = useDeleteMaterial()
  const [confirmOpen, setConfirmOpen] = useState(false)

  function handleDelete() {
    del.mutate(materialId, {
      onSuccess: () => {
        toast.success('자료가 삭제되었습니다.')
        navigate('/admin/materials')
      },
      onError: (err) => {
        setConfirmOpen(false)
        toast.error(toApiError(err).message)
      },
    })
  }

  async function handleDownload(fileId: number, name: string) {
    try {
      await downloadMaterialFile(materialId, fileId, name)
    } catch (err) {
      toast.error(toApiError(err).message)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate('/admin/materials')}
          className="text-sm text-ink-500 hover:text-ink-800"
        >
          ← 목록
        </button>
        <h1 className="text-[22px] font-semibold text-ink-900">자료 상세</h1>
      </div>

      {isLoading && (
        <div className="py-16">
          <Spinner label="불러오는 중..." />
        </div>
      )}
      {isError && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          자료를 찾을 수 없습니다.
        </div>
      )}

      {data && (
        <>
          <div className="mb-5 grid gap-5 lg:grid-cols-2">
            {/* 좌: 대표 이미지 + 메타 */}
            <Card>
              <CardHeader title={data.title} action={<CategoryBadge category={data.category} />} />
              <div className="mb-4 aspect-video overflow-hidden rounded-lg border border-ink-100">
                <AuthImage
                  src={data.thumbnailUrl}
                  alt={data.title}
                  className="h-full w-full object-cover"
                  fallback={<CategoryThumb category={data.category} className="h-full w-full" />}
                />
              </div>
              <dl className="space-y-3 text-[15px]">
                <Row label="키워드">
                  <div className="flex flex-wrap gap-1">
                    {splitKeywords(data.keywords).length > 0 ? (
                      splitKeywords(data.keywords).map((k) => <Badge key={k}>{k}</Badge>)
                    ) : (
                      <span className="text-ink-400">없음</span>
                    )}
                  </div>
                </Row>
                <Row label="등록자">
                  <span className="text-ink-800">{data.uploadedByName}</span>
                </Row>
                <Row label="등록일">
                  <span className="text-ink-800">{formatDate(data.createdAt)}</span>
                </Row>
              </dl>
            </Card>

            {/* 우: 요약 + 원본 파일 */}
            <div className="space-y-5">
              <Card>
                <CardHeader title="요약" />
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink-800">
                  {data.summary}
                </p>
              </Card>

              <Card>
                <CardHeader title="원본 파일" icon="📎" />
                {data.files.length === 0 ? (
                  <p className="text-sm text-ink-500">첨부된 파일이 없습니다.</p>
                ) : (
                  <ul className="space-y-2">
                    {data.files.map((f) => (
                      <li
                        key={f.id}
                        className="flex items-center justify-between rounded-lg border border-ink-200 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[15px] text-ink-900">{f.originalName}</p>
                          <p className="text-xs text-ink-500">
                            {f.mimeType ?? '파일'} · {formatNumber(Math.round(f.size / 1024))} KB
                          </p>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDownload(f.id, f.originalName)}
                        >
                          다운로드
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="danger" onClick={() => setConfirmOpen(true)}>
              자료 삭제
            </Button>
          </div>

          <ConfirmDialog
            open={confirmOpen}
            title="자료를 삭제할까요?"
            description="원본 파일까지 함께 삭제되며 되돌릴 수 없습니다."
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

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <dt className="w-20 shrink-0 text-ink-500">{label}</dt>
      <dd className="flex-1">{children}</dd>
    </div>
  )
}
