import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, className, id, children, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="field-label">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        className={cn(
          'h-10 w-full rounded-lg border border-ink-200 bg-white px-3 text-[15px] text-ink-900',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  ),
)
Select.displayName = 'Select'
