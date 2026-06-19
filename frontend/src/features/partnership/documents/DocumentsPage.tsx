import { useMemo, useState } from 'react'
import { Spinner } from '@/components/ui/Spinner'
import { formatFileSize } from '@/lib/formatters'
import { toApiError } from '@/api/client'
import { toast } from '@/store/toastStore'
import { DOC_TYPES, docTypeLabel } from '@/types/document'
import { DocTypeBadge } from '@/features/admin/documents/components/DocTypeBadge'
import { downloadPartnerDocument } from '@/api/partnerDocuments'
import { usePartnerDocuments } from './hooks/usePartnerDocuments'

export function PartnerDocumentsPage() {
  const { data, isLoading, isError } = usePartnerDocuments()
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  // 종류 고정 순서(BUSINESS_LICENSE → BANK_ACCOUNT → INTRO_DECK → ETC)로 정렬, 빈 그룹 제외.
  const groups = useMemo(() => {
    const order = DOC_TYPES.map((t) => t.value)
    return [...(data ?? [])]
      .filter((g) => g.documents.length > 0)
      .sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type))
  }, [data])

  async function handleDownload(id: number, name: string) {
    setDownloadingId(id)
    try {
      await downloadPartnerDocument(id, name)
      toast.success('다운로드되었습니다.')
    } catch (err) {
      toast.error(toApiError(err).message)
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div>
      {/* 헤더 */}
      <section className="mb-8 text-white">
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">협업 서류</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-white/90">
          EcoLink의 협업용 서류를 내려받을 수 있습니다.
          <br className="hidden sm:block" />
          다운로드 기록은 EcoLink에 전달됩니다.
        </p>
      </section>

      {isLoading && (
        <div className="py-20">
          <Spinner className="text-white" label="불러오는 중..." />
        </div>
      )}
      {isError && (
        <div className="rounded-xl bg-white/95 px-4 py-3 text-sm text-red-600">
          서류를 불러오지 못했습니다.
        </div>
      )}

      {data &&
        (groups.length === 0 ? (
          <div className="rounded-2xl bg-white/95 px-6 py-16 text-center">
            <div className="mb-3 text-4xl">📄</div>
            <p className="text-[15px] font-medium text-ink-900">제공 중인 서류가 없습니다</p>
            <p className="mt-1 text-sm text-ink-500">EcoLink가 서류를 등록하면 여기에 표시됩니다.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {groups.map((group) => (
              <section key={group.type}>
                <div className="mb-3 flex items-center gap-2">
                  <DocTypeBadge type={group.type} />
                  <h2 className="text-lg font-semibold text-white">{docTypeLabel(group.type)}</h2>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {group.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex flex-col rounded-2xl bg-white p-5 shadow-card"
                    >
                      <h3 className="text-[16px] font-semibold text-ink-900">{doc.title}</h3>
                      <p className="mt-1 truncate text-sm text-ink-600">{doc.originalName}</p>
                      <p className="text-xs text-ink-500">{formatFileSize(doc.size)}</p>
                      <button
                        onClick={() => handleDownload(doc.id, doc.originalName)}
                        disabled={downloadingId === doc.id}
                        className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-ink-400"
                      >
                        {downloadingId === doc.id ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            다운로드 중…
                          </>
                        ) : (
                          '다운로드'
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ))}
    </div>
  )
}
