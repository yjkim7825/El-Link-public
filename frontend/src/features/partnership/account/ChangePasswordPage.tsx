import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { changePartnerPassword } from '@/api/auth'
import { toApiError } from '@/api/client'
import { useAuthStore } from '@/store/authStore'

const schema = z
  .object({
    currentPassword: z.string().min(1, '현재 비밀번호를 입력하세요.'),
    newPassword: z.string().min(8, '새 비밀번호는 8자 이상이어야 합니다.'),
    confirmPassword: z.string().min(1, '비밀번호 확인을 입력하세요.'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ['confirmPassword'],
    message: '새 비밀번호가 일치하지 않습니다.',
  })

type FormValues = z.infer<typeof schema>

export function ChangePasswordPage() {
  const navigate = useNavigate()
  const setMustChangePassword = useAuthStore((s) => s.setMustChangePassword)
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    try {
      await changePartnerPassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      setMustChangePassword(false)
      navigate('/partner', { replace: true })
    } catch (err) {
      setServerError(toApiError(err).message)
    }
  }

  return (
    <div className="grid min-h-full place-items-center bg-ink-100 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-ink-200 bg-white p-8 shadow-sm">
        <h1 className="text-lg font-semibold text-ink-900">비밀번호 변경</h1>
        <p className="mt-1 text-sm text-ink-500">최초 로그인 시 비밀번호를 변경해야 합니다.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
          <PasswordInput
            id="currentPassword"
            label="현재(임시) 비밀번호"
            autoComplete="current-password"
            error={errors.currentPassword?.message}
            {...register('currentPassword')}
          />
          <PasswordInput
            id="newPassword"
            label="새 비밀번호"
            autoComplete="new-password"
            error={errors.newPassword?.message}
            {...register('newPassword')}
          />
          <PasswordInput
            id="confirmPassword"
            label="새 비밀번호 확인"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          {serverError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{serverError}</p>
          )}

          <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
            변경하고 계속
          </Button>
        </form>
      </div>
    </div>
  )
}
