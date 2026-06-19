import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

/** legacy .card — 흰 배경, radius 12px, 부드러운 그림자, 패딩. */
export function Card({ className, children, ...props }: CardProps) {
  return (
    <div className={cn('rounded-xl bg-white p-6 shadow-card', className)} {...props}>
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  /** 제목 옆 아이콘/이모지 등. */
  icon?: ReactNode
  action?: ReactNode
}

/** legacy .header(h2 22px/600) + .header-subtitle(15px, ink-600). */
export function CardHeader({ title, subtitle, icon, action }: CardHeaderProps) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[22px] font-semibold text-ink-900">
          {icon}
          {title}
        </h2>
        {action}
      </div>
      {subtitle && <p className="mt-1 text-[15px] text-ink-600">{subtitle}</p>}
    </div>
  )
}
