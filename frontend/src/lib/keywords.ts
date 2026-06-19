/** 콤마 구분 키워드 문자열 → 트림된 배열(빈 값 제거). */
export function splitKeywords(keywords?: string | null): string[] {
  if (!keywords) return []
  return keywords
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)
}
