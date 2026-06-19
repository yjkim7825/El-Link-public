import { cn } from '@/lib/cn'
import { useToastStore, type ToastType } from '@/store/toastStore'

const STYLES: Record<ToastType, string> = {
  success: 'border-brand-200 bg-brand-50 text-brand-800',
  error: 'border-red-200 bg-red-50 text-red-700',
  info: 'border-ink-200 bg-white text-ink-800',
}

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '!',
  info: 'ℹ',
}

/** 우상단 토스트 스택. App 루트에 1회 마운트. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={cn(
            'pointer-events-auto flex cursor-pointer items-start gap-2 rounded-lg border px-4 py-3 text-sm shadow-card',
            STYLES[t.type],
          )}
        >
          <span className="font-bold">{ICONS[t.type]}</span>
          <span className="flex-1">{t.message}</span>
        </div>
      ))}
    </div>
  )
}
