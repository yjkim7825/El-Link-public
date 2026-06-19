import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { formatNumber } from '@/lib/formatters'
import { toApiError } from '@/api/client'
import { toast } from '@/store/toastStore'
import {
  QUOTE_CATEGORIES,
  type CatalogItem,
  type PriceType,
  type QuoteCategory,
} from '@/types/catalog'
import { useCreateCatalog, useUpdateCatalog } from '../hooks/useCatalogMutations'

interface Props {
  open: boolean
  /** 있으면 수정, 없으면 신규. */
  item: CatalogItem | null
  onClose: () => void
}

interface FormState {
  category: QuoteCategory
  itemName: string
  unitPrice: number
  unit: string
  priceType: PriceType
}

const EMPTY: FormState = {
  category: 'PLANNING',
  itemName: '',
  unitPrice: 0,
  unit: '',
  priceType: 'FIXED',
}

export function CatalogFormModal({ open, item, onClose }: Props) {
  const create = useCreateCatalog()
  const update = useUpdateCatalog()
  const [form, setForm] = useState<FormState>(EMPTY)

  // 열릴 때 신규/수정에 맞춰 초기화.
  useEffect(() => {
    if (!open) return
    setForm(
      item
        ? {
            category: item.category,
            itemName: item.itemName,
            unitPrice: item.unitPrice,
            unit: item.unit,
            priceType: item.priceType,
          }
        : EMPTY,
    )
  }, [open, item])

  const isEdit = !!item
  const pending = create.isPending || update.isPending
  // FIXED는 단가 > 0 필수, CUSTOM은 견적 작성 시 입력하므로 0 허용.
  const priceValid = form.priceType === 'CUSTOM' ? form.unitPrice >= 0 : form.unitPrice > 0
  const canSave = form.itemName.trim() && form.unit.trim() && priceValid

  function setPrice(raw: string) {
    const digits = raw.replace(/[^\d]/g, '')
    setForm((f) => ({ ...f, unitPrice: digits ? Number(digits) : 0 }))
  }

  function save() {
    const payload = {
      category: form.category,
      itemName: form.itemName.trim(),
      unitPrice: form.unitPrice,
      unit: form.unit.trim(),
      priceType: form.priceType,
    }
    const onError = (err: unknown) => toast.error(toApiError(err).message)
    if (isEdit) {
      update.mutate(
        { id: item!.id, req: payload },
        {
          onSuccess: () => {
            toast.success('품목이 수정되었습니다.')
            onClose()
          },
          onError,
        },
      )
    } else {
      create.mutate(payload, {
        onSuccess: () => {
          toast.success('품목이 등록되었습니다.')
          onClose()
        },
        onError,
      })
    }
  }

  return (
    <Modal open={open} title={isEdit ? '품목 수정' : '새 품목'} onClose={onClose}>
      <div className="space-y-4">
        <Select
          label="카테고리"
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as QuoteCategory }))}
        >
          {QUOTE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>

        <Input
          label="품명"
          value={form.itemName}
          onChange={(e) => setForm((f) => ({ ...f, itemName: e.target.value }))}
          placeholder="예: 환경 교육 프로그램 운영"
        />

        <Select
          label="단가 유형"
          value={form.priceType}
          onChange={(e) => setForm((f) => ({ ...f, priceType: e.target.value as PriceType }))}
        >
          <option value="FIXED">고정 단가</option>
          <option value="CUSTOM">입력형 (견적 작성 시 입력)</option>
        </Select>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="field-label">단가 (원)</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500">
                ₩
              </span>
              <input
                inputMode="numeric"
                value={form.unitPrice ? formatNumber(form.unitPrice) : ''}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={form.priceType === 'CUSTOM' ? '0 (작성 시 입력)' : '50,000'}
                className="h-10 w-full rounded-lg border border-ink-200 bg-white pl-7 pr-3 text-[15px] text-ink-900 placeholder:text-ink-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
              />
            </div>
            {form.priceType === 'FIXED' && form.unitPrice <= 0 && (
              <p className="mt-1 text-xs text-ink-400">고정 단가는 0보다 커야 합니다.</p>
            )}
          </div>
          <div className="w-28">
            <Input
              label="단위"
              value={form.unit}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
              placeholder="개 / 명 / 회"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={pending}>
          취소
        </Button>
        <Button disabled={!canSave} loading={pending} onClick={save}>
          {isEdit ? '저장' : '등록'}
        </Button>
      </div>
    </Modal>
  )
}
