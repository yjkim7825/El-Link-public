import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Table, THead, Th, Td } from '@/components/ui/Table'
import { formatDate, formatWon } from '@/lib/formatters'
import { toApiError } from '@/api/client'
import { toast } from '@/store/toastStore'
import {
  QUOTE_CATEGORIES,
  categoryLabel,
  type CatalogItem,
  type QuoteCategory,
} from '@/types/catalog'
import { ActiveBadge, PriceTypeBadge } from './components/CatalogBadges'
import { CatalogFormModal } from './components/CatalogFormModal'
import { useCatalog } from './hooks/useCatalog'
import { useUpdateCatalog, useDeleteCatalog } from './hooks/useCatalogMutations'

type Dialog =
  | { kind: 'toggle'; item: CatalogItem }
  | { kind: 'delete'; item: CatalogItem }
  | null

export function CatalogPage() {
  const [category, setCategory] = useState<QuoteCategory | ''>('')
  const [includeInactive, setIncludeInactive] = useState(false)
  const [formItem, setFormItem] = useState<CatalogItem | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [dialog, setDialog] = useState<Dialog>(null)

  const { data, isLoading, isError } = useCatalog({ category, includeInactive })
  const update = useUpdateCatalog()
  const del = useDeleteCatalog()

  function openCreate() {
    setFormItem(null)
    setFormOpen(true)
  }
  function openEdit(item: CatalogItem) {
    setFormItem(item)
    setFormOpen(true)
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
          toast.success('품목이 삭제되었습니다.')
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
          <h1 className="text-[22px] font-semibold text-ink-900">단가표 관리</h1>
          <p className="mt-1 text-sm text-ink-500">견적에 쓰이는 품목 단가를 관리합니다.</p>
        </div>
        <Button onClick={openCreate}>+ 새 품목</Button>
      </div>

      {/* 필터 */}
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div className="w-48">
          <Select
            label="카테고리"
            value={category}
            onChange={(e) => setCategory(e.target.value as QuoteCategory | '')}
          >
            <option value="">전체</option>
            {QUOTE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
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
            icon="🧾"
            title="품목이 없습니다"
            description={category ? '이 카테고리에 품목이 없습니다.' : '새 품목을 등록해보세요.'}
            action={!category ? <Button onClick={openCreate}>+ 새 품목</Button> : undefined}
          />
        ) : (
          <div className="overflow-hidden rounded-xl bg-white p-2 shadow-card">
            <Table>
              <THead>
                <tr>
                  <Th align="left">카테고리</Th>
                  <Th align="left">품명</Th>
                  <Th align="right">단가</Th>
                  <Th>단위</Th>
                  <Th>유형</Th>
                  <Th>상태</Th>
                  <Th>수정일</Th>
                  <Th>액션</Th>
                </tr>
              </THead>
              <tbody>
                {data.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => openEdit(c)}
                    className={`cursor-pointer hover:bg-ink-50 ${c.isActive ? '' : 'opacity-60'}`}
                  >
                    <Td align="left" className="whitespace-nowrap text-ink-600">
                      {categoryLabel(c.category)}
                    </Td>
                    <Td align="left">
                      <span className="font-medium text-ink-900">{c.itemName}</span>
                    </Td>
                    <Td align="right" className="whitespace-nowrap font-medium text-ink-900">
                      {c.priceType === 'CUSTOM' && c.unitPrice === 0 ? '—' : formatWon(c.unitPrice)}
                    </Td>
                    <Td align="center" className="text-ink-600">
                      {c.unit}
                    </Td>
                    <Td align="center">
                      <PriceTypeBadge type={c.priceType} />
                    </Td>
                    <Td align="center">
                      <ActiveBadge active={c.isActive} />
                    </Td>
                    <Td align="center" className="whitespace-nowrap text-ink-600">
                      {formatDate(c.updatedAt)}
                    </Td>
                    <Td align="center" className="whitespace-nowrap">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openEdit(c)
                          }}
                          className="text-sm font-medium text-brand-600 hover:underline"
                        >
                          수정
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setDialog({ kind: 'toggle', item: c })
                          }}
                          className="text-sm font-medium text-ink-600 hover:underline"
                        >
                          {c.isActive ? '비활성화' : '활성화'}
                        </button>
                        {c.isActive && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setDialog({ kind: 'delete', item: c })
                            }}
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

      <CatalogFormModal open={formOpen} item={formItem} onClose={() => setFormOpen(false)} />

      <ConfirmDialog
        open={!!dialog}
        title={
          dialog?.kind === 'delete'
            ? '품목을 삭제할까요?'
            : dialog?.item.isActive
              ? '품목을 비활성화할까요?'
              : '품목을 활성화할까요?'
        }
        description={
          dialog ? (
            <>
              <span className="font-medium text-ink-800">{dialog.item.itemName}</span>{' '}
              {dialog.kind === 'delete'
                ? '품목이 목록에서 숨겨집니다(소프트 삭제). 과거 견적에는 영향이 없습니다.'
                : dialog.item.isActive
                  ? '비활성 품목은 파트너 견적 화면에 표시되지 않습니다.'
                  : '활성화하면 파트너 견적 화면에 다시 표시됩니다.'}
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
