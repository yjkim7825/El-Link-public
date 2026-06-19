import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { DropZone } from '@/components/ui/DropZone'
import { formatFileSize } from '@/lib/formatters'
import { toApiError } from '@/api/client'
import { toast } from '@/store/toastStore'
import { DOC_TYPES, type CompanyDocType, type DocumentItem } from '@/types/document'
import { useCreateDocument, useUpdateDocument } from '../hooks/useDocumentMutations'

interface Props {
  open: boolean
  /** 있으면 수정(제목/활성여부만), 없으면 신규 업로드. */
  item: DocumentItem | null
  onClose: () => void
}

const MAX_BYTES = 10 * 1024 * 1024 // 10MB

export function DocumentFormModal({ open, item, onClose }: Props) {
  const create = useCreateDocument()
  const update = useUpdateDocument()

  const [type, setType] = useState<CompanyDocType>('BUSINESS_LICENSE')
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isActive, setIsActive] = useState(true)
  const [progress, setProgress] = useState(0)

  const isEdit = !!item

  useEffect(() => {
    if (!open) return
    if (item) {
      setType(item.type)
      setTitle(item.title)
      setIsActive(item.isActive)
      setFile(null)
    } else {
      setType('BUSINESS_LICENSE')
      setTitle('')
      setIsActive(true)
      setFile(null)
    }
    setProgress(0)
  }, [open, item])

  const canSave = isEdit ? !!title.trim() : !!title.trim() && !!file

  function save() {
    const onError = (err: unknown) => toast.error(toApiError(err).message)
    if (isEdit) {
      update.mutate(
        { id: item!.id, req: { title: title.trim(), isActive } },
        {
          onSuccess: () => {
            toast.success('서류가 수정되었습니다.')
            onClose()
          },
          onError,
        },
      )
    } else {
      if (!file) return
      create.mutate(
        { type, title: title.trim(), file, onProgress: setProgress },
        {
          onSuccess: () => {
            toast.success('서류가 업로드되었습니다.')
            onClose()
          },
          onError,
        },
      )
    }
  }

  return (
    <Modal open={open} title={isEdit ? '서류 수정' : '새 서류 업로드'} onClose={onClose}>
      <div className="space-y-4">
        <Select
          label="종류"
          value={type}
          disabled={isEdit}
          onChange={(e) => setType(e.target.value as CompanyDocType)}
        >
          {DOC_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
        {isEdit && <p className="-mt-2 text-xs text-ink-400">종류와 파일은 수정할 수 없습니다.</p>}

        <Input
          label="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 2026년 사업자등록증"
        />

        {isEdit ? (
          <>
            <div className="rounded-lg border border-ink-200 px-4 py-3">
              <p className="text-xs text-ink-500">현재 파일</p>
              <p className="mt-0.5 truncate text-[15px] text-ink-900">{item!.originalName}</p>
              <p className="text-xs text-ink-500">{formatFileSize(item!.size)}</p>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-700">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-ink-300 text-brand-500 focus:ring-brand-400"
              />
              활성 상태 (체크 해제 시 파트너에게 숨김)
            </label>
          </>
        ) : (
          <>
            <DropZone
              file={file}
              onFile={setFile}
              accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              maxBytes={MAX_BYTES}
              onError={(m) => toast.error(m)}
              hint="PDF · 이미지 · 오피스 문서 (최대 10MB)"
            />
            {create.isPending && (
              <div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100">
                  <div
                    className="h-full rounded-full bg-brand-500 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-ink-500">업로드 중… {progress}%</p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={create.isPending || update.isPending}>
          취소
        </Button>
        <Button
          disabled={!canSave}
          loading={create.isPending || update.isPending}
          onClick={save}
        >
          {isEdit ? '저장' : '업로드'}
        </Button>
      </div>
    </Modal>
  )
}
