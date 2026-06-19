import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { formatDate, formatDateTime } from '@/lib/formatters'
import { toApiError } from '@/api/client'
import { toast } from '@/store/toastStore'
import { logout as apiLogout } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { useMyInfo, useChangePassword } from './hooks/useAccount'

export function AccountPage() {
  const navigate = useNavigate()
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const { data, isLoading, isError } = useMyInfo()
  const change = useChangePassword()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [confirmError, setConfirmError] = useState<string | null>(null)

  const canSubmit =
    currentPassword.length > 0 && newPassword.length >= 8 && confirmPassword.length > 0

  function submitPassword(e: FormEvent) {
    e.preventDefault()
    setConfirmError(null)
    if (newPassword !== confirmPassword) {
      setConfirmError('새 비밀번호가 일치하지 않습니다.')
      return
    }
    change.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          toast.success('비밀번호가 변경되었습니다.')
          setCurrentPassword('')
          setNewPassword('')
          setConfirmPassword('')
        },
        onError: (err) => toast.error(toApiError(err).message),
      },
    )
  }

  async function handleLogout() {
    try {
      await apiLogout()
    } finally {
      clearAuth()
      navigate('/', { replace: true })
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-3xl font-bold text-white">내 계정</h1>

      {isLoading && (
        <div className="py-20">
          <Spinner className="text-white" label="불러오는 중..." />
        </div>
      )}
      {isError && (
        <div className="rounded-xl bg-white/95 px-4 py-3 text-sm text-red-600">
          정보를 불러오지 못했습니다.
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* 섹션 1 — 내 정보 */}
          <section className="rounded-2xl bg-white p-6 shadow-card">
            <h2 className="text-lg font-semibold text-ink-900">내 정보</h2>
            <dl className="mt-4 space-y-3 text-[15px]">
              <Row label="회사명" value={data.companyName} />
              <Row label="담당자명" value={data.contactName} />
              <Row label="이메일" value={data.email} />
              <Row label="연락처" value={data.phone || '-'} />
              <Row label="가입일" value={formatDate(data.createdAt)} />
              <Row
                label="마지막 로그인"
                value={data.lastLoginAt ? formatDateTime(data.lastLoginAt) : '-'}
              />
            </dl>
            <p className="mt-4 rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-500">
              정보 변경이 필요하면 EcoLink에 문의해주세요.
            </p>
          </section>

          {/* 섹션 2 — 비밀번호 변경 */}
          <section className="rounded-2xl bg-white p-6 shadow-card">
            <h2 className="text-lg font-semibold text-ink-900">비밀번호 변경</h2>
            <form onSubmit={submitPassword} className="mt-4 max-w-md space-y-4" noValidate>
              <PasswordInput
                id="currentPassword"
                label="현재 비밀번호"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <PasswordInput
                id="newPassword"
                label="새 비밀번호"
                autoComplete="new-password"
                placeholder="8자 이상, 영문+숫자 조합 권장"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                error={
                  newPassword.length > 0 && newPassword.length < 8
                    ? '8자 이상이어야 합니다.'
                    : undefined
                }
              />
              <PasswordInput
                id="confirmPassword"
                label="새 비밀번호 확인"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={confirmError ?? undefined}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={!canSubmit} loading={change.isPending}>
                  변경
                </Button>
              </div>
            </form>
          </section>

          {/* 섹션 3 — 로그아웃 */}
          <section className="rounded-2xl bg-white p-6 shadow-card">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-ink-900">로그아웃</h2>
                <p className="mt-0.5 text-sm text-ink-500">이 기기에서 로그아웃합니다.</p>
              </div>
              <Button variant="secondary" onClick={handleLogout}>
                로그아웃
              </Button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-500">{label}</dt>
      <dd className="text-right font-medium text-ink-900">{value}</dd>
    </div>
  )
}
