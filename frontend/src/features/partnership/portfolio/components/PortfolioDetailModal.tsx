import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { AuthImage } from '@/components/ui/AuthImage'
import { splitKeywords } from '@/lib/keywords'
import { formatFileSize } from '@/lib/formatters'
import { toApiError } from '@/api/client'
import { toast } from '@/store/toastStore'
import { CategoryBadge } from '@/features/admin/materials/components/CategoryBadge'
import { CategoryThumb } from '@/features/admin/materials/components/CategoryThumb'
import { downloadPortfolioFile } from '@/api/partnerPortfolio'
import { usePortfolioItem } from '../hooks/usePortfolio'

interface Props {
  id: number | null
  onClose: () => void
}

const isImage = (mime?: string | null) => !!mime && mime.startsWith('image/')

/** 포트폴리오 상세 모달 — 대표 이미지 + 정보 + 첨부 갤러리(이미지 인라인 / 그 외 다운로드). */
export function PortfolioDetailModal({ id, onClose }: Props) {
  const { data, isLoading, isError } = usePortfolioItem(id)

  async function handleDownload(fileId: number, name: string) {
    if (id == null) return
    try {
      await downloadPortfolioFile(id, fileId, name)
    } catch (err) {
      toast.error(toApiError(err).message)
    }
  }

  const images = data?.files.filter((f) => isImage(f.mimeType)) ?? []
  const docs = data?.files.filter((f) => !isImage(f.mimeType)) ?? []

  return (
    <Modal open={id != null} onClose={onClose} size="lg" title={data ? undefined : '자료'}>
      {isLoading && (
        <div className="py-12">
          <Spinner label="불러오는 중..." />
        </div>
      )}
      {isError && <p className="py-8 text-center text-sm text-red-600">자료를 불러오지 못했습니다.</p>}

      {data && (
        <div>
          {/* 헤더 */}
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <CategoryBadge category={data.category} />
              <h2 className="mt-2 text-2xl font-bold text-ink-900">{data.title}</h2>
            </div>
            <button onClick={onClose} className="text-ink-400 hover:text-ink-700" aria-label="닫기">
              ✕
            </button>
          </div>

          {/* 대표 이미지 */}
          <div className="mb-5 aspect-video overflow-hidden rounded-xl border border-ink-100">
            <AuthImage
              src={data.thumbnailUrl}
              alt={data.title}
              className="h-full w-full object-cover"
              fallback={<CategoryThumb category={data.category} className="h-full w-full" />}
            />
          </div>

          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink-700">
            {data.summary}
          </p>

          {splitKeywords(data.keywords).length > 0 && (
            <div className="mt-5">
              <p className="mb-1.5 text-xs font-medium text-ink-500">키워드</p>
              <div className="flex flex-wrap gap-1.5">
                {splitKeywords(data.keywords).map((k) => (
                  <span
                    key={k}
                    className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 첨부 이미지 갤러리(인라인) */}
          {images.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-xs font-medium text-ink-500">첨부 이미지</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {images.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleDownload(f.id, f.originalName)}
                    title="클릭하여 원본 다운로드"
                    className="group aspect-square overflow-hidden rounded-lg border border-ink-200"
                  >
                    <AuthImage
                      src={`/partner/portfolio/${data.id}/files/${f.id}/download`}
                      alt={f.originalName}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      fallback={
                        <div className="flex h-full w-full items-center justify-center bg-ink-100 text-xs text-ink-500">
                          이미지
                        </div>
                      }
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 그 외 첨부 파일(다운로드) */}
          {docs.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-xs font-medium text-ink-500">첨부 파일</p>
              <ul className="space-y-2">
                {docs.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-ink-200 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[15px] text-ink-900">{f.originalName}</p>
                      <p className="text-xs text-ink-500">
                        {f.mimeType ?? '파일'} · {formatFileSize(f.size)}
                      </p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => handleDownload(f.id, f.originalName)}>
                      다운로드
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <Button variant="secondary" onClick={onClose}>
              닫기
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
