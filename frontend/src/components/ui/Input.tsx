import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

// legacy 입력 매핑: border #e5e5ea(ink-200), radius 8px, 15px, focus 브랜드 링
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="field-label">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          'h-10 w-full rounded-lg border bg-white px-3 text-[15px] text-ink-900 placeholder:text-ink-400',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
          error ? 'border-red-400' : 'border-ink-200',
          className,
        )}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  ),
)
Input.displayName = 'Input'
