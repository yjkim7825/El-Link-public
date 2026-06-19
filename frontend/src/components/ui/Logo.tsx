import { cn } from '@/lib/cn'

interface LogoProps {
  /** 로고 폭(Tailwind 클래스). 기본 w-32(≈legacy 사이드바 150px). */
  className?: string
  /** 밝은 배경용 — 브랜드 블루 칩 안에 흰 워드마크를 담는다. */
  chip?: boolean
}

/**
 * EcoLink 로고(흰 워드마크, public/logo.png). 원본이 흰색이라 블루 배경 위에서 보인다.
 * - 기본: 블루 배경(사이드바 등)에 그대로 사용.
 * - chip: 흰/밝은 배경(로그인·홈)에서 블루 칩으로 감싸 가시성 확보.
 */
export function Logo({ className, chip }: LogoProps) {
  const img = (
    <img src="/logo.png" alt="EcoLink" className={cn('h-auto w-32', className)} />
  )
  if (chip) {
    return (
      <div className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-5 py-3 shadow-card">
        {img}
      </div>
    )
  }
  return img
}
