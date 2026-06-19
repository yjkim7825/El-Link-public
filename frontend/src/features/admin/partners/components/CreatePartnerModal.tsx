import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toApiError } from '@/api/client'
import { toast } from '@/store/toastStore'
import type { CreatePartnerResponse } from '@/types/partner'
import { useCreatePartner } from '../hooks/usePartnerMutations'

interface Props {
  open: boolean
  onClose: () => void
}

const EMPTY = { email: '', companyName: '', contactName: '', phone: '' }

/** 파트너 등록 모달. 등록 성공 시 같은 모달에서 임시비번을 1회 노출한다. */
export function CreatePartnerModal({ open, onClose }: Props) {
  const create = useCreatePartner()
  const [form, setForm] = useState(EMPTY)
  const [result, setResult] = useState<CreatePartnerResponse | null>(null)

  // 모달이 열릴 때마다 초기화(이전 입력/결과 잔상 제거).
  useEffect(() => {
    if (open) {
      setForm(EMPTY)
      setResult(null)
    }
  }, [open])

  const canSubmit = form.email.trim() && form.companyName.trim() && form.contactName.trim()

  function submit() {
    create.mutate(
      {
        email: form.email.trim(),
        companyName: form.companyName.trim(),
        contactName: form.contactName.trim(),
        phone: form.phone.trim() || null,
      },
      {
        onSuccess: (res) => setResult(res),
        onError: (err) => toast.error(toApiError(err).message),
      },
    )
  }

  async function copyPassword() {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.temporaryPassword)
      toast.success('복사됨')
    } catch {
      toast.error('복사에 실패했습니다. 직접 선택해 복사하세요.')
    }
  }

  // 결과 화면: 배경 클릭/ESC로 닫히지 않게(임시비번 확인 강제)
  if (result) {
    return (
      <Modal open={open} title="파트너 등록 완료" onClose={onClose} dismissable={false}>
        <p className="text-sm text-ink-600">
          <span className="font-medium text-ink-800">{result.companyName}</span> 파트너가 등록되었습니다.
        </p>
        <div className="mt-4 rounded-xl bg-brand-50 px-4 py-5 text-center">
          <p className="text-xs font-medium text-brand-700">임시 비밀번호</p>
          <p className="mt-2 select-all font-mono text-2xl font-bold tracking-wider text-ink-900">
            {result.temporaryPassword}
          </p>
          <Button variant="secondary" size="sm" className="mt-3" onClick={copyPassword}>
            복사
          </Button>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-ink-500">
          ⚠️ 이 비밀번호는 한 번만 표시됩니다. 파트너에게 직접 전달하세요. 파트너는 첫 로그인 시 비밀번호를
          변경해야 합니다.
        </p>
        <div className="mt-6 flex justify-end">
          <Button onClick={onClose}>확인</Button>
        </div>
      </Modal>
    )
  }

  // 입력 폼
  return (
    <Modal open={open} title="새 파트너 등록" onClose={onClose}>
      <div className="space-y-4">
        <Input
          label="회사명"
          value={form.companyName}
          onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
          placeholder="예: ○○회사"
        />
        <Input
          label="담당자명"
          value={form.contactName}
          onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
          placeholder="예: 홍길동"
        />
        <Input
          label="이메일"
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          placeholder="partner@company.demo"
        />
        <Input
          label="연락처 (선택)"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          placeholder="010-0000-0000"
        />
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={create.isPending}>
          취소
        </Button>
        <Button disabled={!canSubmit} loading={create.isPending} onClick={submit}>
          등록
        </Button>
      </div>
    </Modal>
  )
}
