/** 원화 천단위 콤마. */
export function formatWon(value: number): string {
  return new Intl.NumberFormat('ko-KR').format(value) + '원'
}

/** 숫자 천단위 콤마. */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('ko-KR').format(value)
}

/** 바이트 → KB/MB 자동 변환(예: 532 KB, 2.4 MB). */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${Math.round(kb)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

/** ISO 문자열 → yyyy.MM.dd HH:mm (Asia/Seoul). */
export function formatDateTime(iso?: string | null): string {
  if (!iso) return '-'
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(new Date(iso))
    .replace(/\.\s?(?=\d{2}:)/, ' ')
    .replace(/\.\s/g, '.')
    .replace(/\.\s*$/, '')
}

/** ISO 문자열 → yyyy.MM.dd (Asia/Seoul). */
export function formatDate(iso?: string | null): string {
  if (!iso) return '-'
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date(iso))
    .replace(/\.\s?$/, '')
    .replace(/\.\s/g, '.')
}
