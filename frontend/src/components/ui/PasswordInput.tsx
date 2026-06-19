import { forwardRef, useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/cn'

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

/** 비밀번호 입력 — show/hide 토글 포함. Input 스타일과 동일 톤. */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const [show, setShow] = useState(false)
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="field-label">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={show ? 'text' : 'password'}
            className={cn(
              'h-10 w-full rounded-lg border bg-white pl-3 pr-12 text-[15px] text-ink-900 placeholder:text-ink-400',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
              error ? 'border-red-400' : 'border-ink-200',
              className,
            )}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-2 text-ink-400 transition-colors hover:text-ink-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            tabIndex={-1}
            aria-label={show ? '비밀번호 숨기기' : '비밀번호 표시'}
            aria-pressed={show}
            title={show ? '비밀번호 숨기기' : '비밀번호 표시'}
          >
            {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    )
  },
)
PasswordInput.displayName = 'PasswordInput'
