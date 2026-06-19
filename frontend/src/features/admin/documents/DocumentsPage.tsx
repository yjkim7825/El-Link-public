import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Table, THead, Th, Td } from '@/components/ui/Table'
import { formatDate, formatFileSize } from '@/lib/formatters'
import { toApiError } from '@/api/client'
import { toast } from '@/store/toastStore'
import { downloadDocument } from '@/api/documents'
import { DOC_TYPES, type CompanyDocType, type DocumentItem } from '@/types/document'
import { DocTypeBadge } from './components/DocTypeBadge'
import { ActiveBadge } from '@/features/admin/catalog/components/CatalogBadges'
import { DocumentFormModal } from './components/DocumentFormModal'
import { useDocuments } from './hooks/useDocuments'
import { useUpdateDocument, useDeleteDocument } from './hooks/useDocumentMutations'

type Dialog =
  | { kind: 'toggle'; item: DocumentItem }
  | { kind: 'delete'; item: DocumentItem }
  | null

export function AdminDocumentsPage() {
  const navigate = useNavigate()
  const [type, setType] = useState<CompanyDocType | ''>('')
  const [includeInactive, setIncludeInactive] = useState(false)
  const [formItem, setFormItem] = useState<DocumentItem | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [dialog, setDialog] = useState<Dialog>(null)

  const { data, isLoading, isError } = useDocuments({ type, includeInactive })
  const update = useUpdateDocument()
  const del = useDeleteDocument()

  function openCreate() {
    setFormItem(null)
    setFormOpen(true)
  }
  function openEdit(item: DocumentItem) {
    setFormItem(item)
    setFormOpen(true)
  }

  async function handleDownload(d: DocumentItem) {
    try {
      await downloadDocument(d.id, d.originalName)
    } catch (err) {
      toast.error(toApiError(err).message)
    }
  }

  function confirmDialog() {
    if (!dialog) return
    if (dialog.kind === 'toggle') {
      const next = !dialog.item.isActive
      update.mutate(
        { id: dialog.item.id, req: { isActive: next } },
        {
          onSuccess: () => {
            toast.success(next ? '활성화되었습니다.' : '비활성화되었습니다.')
            setDialog(null)
          },
          onError: (err) => {
            toast.error(toApiError(err).message)
            setDialog(null)
          },
        },
      )
    } else {
      del.mutate(dialog.item.id, {
        onSuccess: () => {
          toast.success('서류가 삭제되었습니다.')
          setDialog(null)
        },
        onError: (err) => {
          toast.error(toApiError(err).message)
          setDialog(null)
        },
      })
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-ink-900">회사 서류</h1>
          <p className="mt-1 text-sm text-ink-500">파트너에게 제공하는 고정 서류를 관리합니다.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/admin/documents/issues')}>
            발급 이력
          </Button>
          <Button onClick={openCreate}>+ 새 서류 업로드</Button>
        </div>
      </div>

      {/* 필터 */}
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div className="w-48">
          <Select
            label="종류"
            value={type}
            onChange={(e) => setType(e.target.value as CompanyDocType | '')}
          >
            <option value="">전체</option>
            {DOC_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </div>
        <label className="flex h-10 cursor-pointer items-center gap-2 text-sm text-ink-700">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
            className="h-4 w-4 rounded border-ink-300 text-brand-500 focus:ring-brand-400"
          />
          비활성 포함
        </label>
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
            icon="📄"
            title="등록된 서류가 없습니다"
            description={type ? '이 종류의 서류가 없습니다.' : '새 서류를 업로드해보세요.'}
            action={!type ? <Button onClick={openCreate}>+ 새 서류 업로드</Button> : undefined}
          />
        ) : (
          <div className="overflow-hidden rounded-xl bg-white p-2 shadow-card">
            <Table>
              <THead>
                <tr>
                  <Th>종류</Th>
                  <Th align="left">제목</Th>
                  <Th align="left">파일명</Th>
                  <Th align="right">크기</Th>
                  <Th>상태</Th>
                  <Th>업로드일</Th>
                  <Th>액션</Th>
                </tr>
              </THead>
              <tbody>
                {data.map((d) => (
                  <tr key={d.id} className={`hover:bg-ink-50 ${d.isActive ? '' : 'opacity-60'}`}>
                    <Td align="center">
                      <DocTypeBadge type={d.type} />
                    </Td>
                    <Td align="left">
                      <span className="font-medium text-ink-900">{d.title}</span>
                    </Td>
                    <Td align="left" className="max-w-[220px] truncate text-ink-600">
                      {d.originalName}
                    </Td>
                    <Td align="right" className="whitespace-nowrap text-ink-600">
                      {formatFileSize(d.size)}
                    </Td>
                    <Td align="center">
                      <ActiveBadge active={d.isActive} />
                    </Td>
                    <Td align="center" className="whitespace-nowrap text-ink-600">
                      {formatDate(d.updatedAt)}
                    </Td>
                    <Td align="center" className="whitespace-nowrap">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => openEdit(d)}
                          className="text-sm font-medium text-brand-600 hover:underline"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDownload(d)}
                          className="text-sm font-medium text-ink-700 hover:underline"
                        >
                          다운로드
                        </button>
                        <button
                          onClick={() => setDialog({ kind: 'toggle', item: d })}
                          className="text-sm font-medium text-ink-600 hover:underline"
                        >
                          {d.isActive ? '비활성화' : '활성화'}
                        </button>
                        {d.isActive && (
                          <button
                            onClick={() => setDialog({ kind: 'delete', item: d })}
                            className="text-sm font-medium text-red-600 hover:underline"
                          >
                            삭제
                          </button>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        ))}

      <DocumentFormModal open={formOpen} item={formItem} onClose={() => setFormOpen(false)} />

      <ConfirmDialog
        open={!!dialog}
        title={
          dialog?.kind === 'delete'
            ? '서류를 삭제할까요?'
            : dialog?.item.isActive
              ? '서류를 비활성화할까요?'
              : '서류를 활성화할까요?'
        }
        description={
          dialog ? (
            <>
              <span className="font-medium text-ink-800">{dialog.item.title}</span>{' '}
              {dialog.kind === 'delete'
                ? '서류가 목록에서 숨겨집니다(소프트 삭제). 과거 발급 이력에는 영향이 없습니다.'
                : dialog.item.isActive
                  ? '비활성 서류는 파트너 화면에 표시되지 않습니다.'
                  : '활성화하면 파트너 화면에 다시 표시됩니다.'}
            </>
          ) : undefined
        }
        confirmLabel={
          dialog?.kind === 'delete' ? '삭제' : dialog?.item.isActive ? '비활성화' : '활성화'
        }
        danger={dialog?.kind === 'delete' || dialog?.item.isActive}
        loading={update.isPending || del.isPending}
        onConfirm={confirmDialog}
        onCancel={() => setDialog(null)}
      />
    </div>
  )
}
