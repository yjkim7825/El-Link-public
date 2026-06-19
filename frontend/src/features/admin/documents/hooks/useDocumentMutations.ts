import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createDocument, deleteDocument, updateDocument } from '@/api/documents'
import type { CompanyDocType, UpdateDocumentRequest } from '@/types/document'

/** 업로드(multipart, 진행률 콜백). 성공 시 목록 캐시 무효화. */
export function useCreateDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: {
      type: CompanyDocType
      title: string
      file: File
      onProgress?: (p: number) => void
    }) => createDocument({ type: vars.type, title: vars.title, file: vars.file }, vars.onProgress),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  })
}

/** 제목/활성여부 수정. 성공 시 목록 캐시 무효화. */
export function useUpdateDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: number; req: UpdateDocumentRequest }) =>
      updateDocument(vars.id, vars.req),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  })
}

/** soft delete. 성공 시 목록 캐시 무효화. */
export function useDeleteDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteDocument(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  })
}
