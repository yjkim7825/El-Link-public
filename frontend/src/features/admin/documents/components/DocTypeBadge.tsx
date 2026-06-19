import { cn } from '@/lib/cn'
import { docTypeLabel, type CompanyDocType } from '@/types/document'

/** 문서 종류 뱃지. BUSINESS_LICENSE=blue, BANK_ACCOUNT=amber, INTRO_DECK=brand, ETC=ink. */
const TONES: Record<CompanyDocType, string> = {
  BUSINESS_LICENSE: 'bg-blue-100 text-blue-700',
  BANK_ACCOUNT: 'bg-amber-100 text-amber-700',
  INTRO_DECK: 'bg-brand-100 text-brand-700',
  ETC: 'bg-ink-100 text-ink-700',
}

export function DocTypeBadge({ type }: { type: CompanyDocType }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        TONES[type],
      )}
    >
      {docTypeLabel(type)}
    </span>
  )
}
