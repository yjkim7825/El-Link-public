import { cn } from '@/lib/cn'
import type { PartnerStatus } from '@/types/partner'

/** 파트너 상태 뱃지. INVITED=블루(초대됨), ACTIVE=그린(활성), DISABLED=그레이(비활성). */
const STATUS: Record<PartnerStatus, { label: string; tone: string }> = {
  ACTIVE: { label: '활성', tone: 'bg-green-100 text-green-700' },
  DISABLED: { label: '비활성', tone: 'bg-ink-200 text-ink-600' },
  INVITED: { label: '초대됨', tone: 'bg-blue-100 text-blue-700' },
}

export function PartnerStatusBadge({ status }: { status: PartnerStatus }) {
  const s = STATUS[status]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        s.tone,
      )}
    >
      {s.label}
    </span>
  )
}
