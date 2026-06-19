import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Table, THead, Th, Td } from '@/components/ui/Table'
import { formatDate } from '@/lib/formatters'
import { splitKeywords } from '@/lib/keywords'
import { toApiError } from '@/api/client'
import { toast } from '@/store/toastStore'
import { type MaterialListItem } from '@/types/material'
import { CategoryBadge } from './components/CategoryBadge'
import { useMaterials } from './hooks/useMaterials'
import { useMaterialCategories } from './hooks/useMaterialCategories'
import { useDeleteMaterial } from './hooks/useMaterialMutations'

export function MaterialsPage() {
  const navigate = useNavigate()
  const [category, setCategory] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [target, setTarget] = useState<MaterialListItem | null>(null) // 삭제 확인 대상

  const { data, isLoading, isError } = useMaterials({ category, keyword })
  const categories = useMaterialCategories() // 실제 데이터 기반 카테고리 옵션
  const del = useDeleteMaterial()

  function confirmDelete() {
    if (!target) return
    del.mutate(target.id, {
      onSuccess: () => {
        toast.success('자료가 삭제되었습니다.')
        setTarget(null)
      },
      onError: (err) => {
        toast.error(toApiError(err).message)
        setTarget(null)
      },
    })
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-ink-900">자료 관리</h1>
          <p className="mt-1 text-sm text-ink-500">업로드 자료를 AI로 분류·관리합니다.</p>
        </div>
        <Button onClick={() => navigate('/admin/materials/new')}>+ 새 자료 분석</Button>
      </div>

      {/* 필터 */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          setKeyword(keywordInput.trim())
        }}
        className="mb-4 flex flex-wrap items-end gap-3"
      >
        <div className="w-48">
          <Select label="카테고리" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">전체</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-64">
          <Input
            label="키워드 검색"
            placeholder="제목·키워드 검색"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
          />
        </div>
        <Button type="submit" variant="secondary">
          검색
        </Button>
      </form>

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
            icon="📂"
            title="등록된 자료가 없습니다"
            description="새 자료를 분석해 첫 항목을 추가해보세요."
            action={
              <Button onClick={() => navigate('/admin/materials/new')}>+ 새 자료 분석</Button>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-xl bg-white p-2 shadow-card">
            <Table>
              <THead>
                <tr>
                  <Th align="left">제목</Th>
                  <Th>카테고리</Th>
                  <Th align="left">키워드</Th>
                  <Th>업로드일</Th>
                  <Th>액션</Th>
                </tr>
              </THead>
              <tbody>
                {data.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => navigate(`/admin/materials/${m.id}`)}
                    className="cursor-pointer hover:bg-ink-50"
                  >
                    <Td align="left">
                      <span className="font-medium text-ink-900">{m.title}</span>
                      {m.fileCount > 0 && (
                        <span className="ml-2 text-xs text-ink-400">📎 {m.fileCount}</span>
                      )}
                    </Td>
                    <Td align="center">
                      <CategoryBadge category={m.category} />
                    </Td>
                    <Td align="left">
                      <div className="flex flex-wrap gap-1">
                        {splitKeywords(m.keywords).map((k) => (
                          <Badge key={k}>{k}</Badge>
                        ))}
                      </div>
                    </Td>
                    <Td align="center" className="whitespace-nowrap text-ink-600">
                      {formatDate(m.createdAt)}
                    </Td>
                    {/* 행 클릭과 분리: 액션은 stopPropagation */}
                    <Td align="center" className="whitespace-nowrap">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/admin/materials/${m.id}`)
                          }}
                          className="text-sm font-medium text-brand-600 hover:underline"
                        >
                          보기
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setTarget(m)
                          }}
                          className="text-sm font-medium text-red-600 hover:underline"
                        >
                          삭제
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        ))}

      <ConfirmDialog
        open={!!target}
        title="자료를 삭제할까요?"
        description={
          target ? (
            <>
              <span className="font-medium text-ink-800">{target.title}</span> 자료와 첨부 파일이 함께
              삭제되며 되돌릴 수 없습니다.
            </>
          ) : undefined
        }
        confirmLabel="삭제"
        danger
        loading={del.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setTarget(null)}
      />
    </div>
  )
}
