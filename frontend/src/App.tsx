import { AppRoutes } from '@/routes/AppRoutes'
import { Toaster } from '@/components/ui/Toaster'
import { useBootstrapAuth } from '@/hooks/useBootstrapAuth'
import { useAuthStore } from '@/store/authStore'

export default function App() {
  useBootstrapAuth()
  const bootstrapped = useAuthStore((s) => s.bootstrapped)

  return (
    <>
      <Toaster />
      {bootstrapped ? (
        <AppRoutes />
      ) : (
        // 최초 refresh 복구가 끝나기 전엔 보호 라우트 판단을 미룬다(깜빡임 방지).
        <div className="grid min-h-full place-items-center bg-ink-50">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
        </div>
      )}
    </>
  )
}
