import { cn } from '@/lib/cn'

interface SpinnerProps {
  className?: string
  /** 안내 문구(legacy .loading-state). */
  label?: string
}

/** legacy .loader-small — 브랜드 컬러 회전 스피너. */
export function Spinner({ className, label }: SpinnerProps) {
  return (
    <div className="flex items-center justify-center gap-3 text-ink-600">
      <span
        className={cn(
          'h-5 w-5 animate-spin rounded-full border-[3px] border-ink-200 border-t-brand-500',
          className,
        )}
      />
      {label && <span className="text-sm">{label}</span>}
    </div>
  )
}
