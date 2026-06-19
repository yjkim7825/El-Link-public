import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Logo } from '@/components/ui/Logo'
import { APP_NAME } from '@/lib/constants'
import { toApiError } from '@/api/client'
import type { LoginRequest, LoginResponse } from '@/types/auth'

const schema = z.object({
  email: z.string().min(1, '이메일을 입력하세요.').email('이메일 형식이 올바르지 않습니다.'),
  password: z.string().min(1, '비밀번호를 입력하세요.'),
})

type FormValues = z.infer<typeof schema>

interface LoginCardProps {
  title: string
  subtitle: string
  loginFn: (req: LoginRequest) => Promise<LoginResponse>
  onSuccess: (res: LoginResponse) => void
  switchHref: string
  switchLabel: string
  hint?: string
}

export function LoginCard({
  title,
  subtitle,
  loginFn,
  onSuccess,
  switchHref,
  switchLabel,
  hint,
}: LoginCardProps) {
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    try {
      const res = await loginFn(values)
      onSuccess(res)
    } catch (err) {
      setServerError(toApiError(err).message)
    }
  }

  return (
    <div className="grid min-h-full place-items-center bg-ink-100 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-ink-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mb-3 flex justify-center">
            <Logo chip className="w-28" />
          </div>
          <h1 className="text-lg font-semibold text-ink-900">
            {APP_NAME} · {title}
          </h1>
          <p className="mt-1 text-sm text-ink-500">{subtitle}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input
            id="email"
            type="email"
            label="이메일"
            placeholder="you@example.com"
            autoComplete="username"
            error={errors.email?.message}
            {...register('email')}
          />
          <PasswordInput
            id="password"
            label="비밀번호"
            placeholder="••••••••"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />

          {serverError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{serverError}</p>
          )}

          <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
            로그인
          </Button>
        </form>

        {hint && <p className="mt-4 text-center text-xs text-ink-400">{hint}</p>}

        <div className="mt-6 border-t border-ink-100 pt-4 text-center">
          <Link to={switchHref} className="text-sm text-brand-600 hover:underline">
            {switchLabel}
          </Link>
        </div>
      </div>
    </div>
  )
}
