import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { cn } from '@/lib/cn'

interface ModalProps {
  open: boolean
  title?: ReactNode
  onClose: () => void
  /** ESC·배경 클릭으로 닫기 비활성화(예: 임시비번 결과 모달). */
  dismissable?: boolean
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

const SIZES: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
}

/** 범용 모달(헤더 + 본문). 확인/취소 액션은 children에서 직접 구성한다. */
export function Modal({ open, title, onClose, dismissable = true, size = 'md', children }: ModalProps) {
  useEffect(() => {
    if (!open || !dismissable) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, dismissable, onClose])

  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={() => dismissable && onClose()}
    >
      <div
        className={cn('w-full rounded-2xl bg-white p-6 shadow-panel', SIZES[size])}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
            {dismissable && (
              <button
                onClick={onClose}
                className="text-ink-400 hover:text-ink-700"
                aria-label="닫기"
              >
                ✕
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
