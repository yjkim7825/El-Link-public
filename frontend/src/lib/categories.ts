/** 자료 카테고리는 자유 입력 String(백엔드 enum 아님). 실제 데이터에서 distinct 추출해 칩/옵션을 만든다. */

/** 항목 배열에서 카테고리 값을 중복 제거 + 가나다 정렬해 반환. */
export function distinctCategories(items: { category?: string | null }[]): string[] {
  const set = new Set<string>()
  for (const it of items) {
    const c = it.category?.trim()
    if (c) set.add(c)
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'ko'))
}

/** 추천값 + 실제 데이터 카테고리를 합쳐 중복 제거(자동완성 제안용). */
export function categorySuggestions(suggested: readonly string[], existing: string[]): string[] {
  const set = new Set<string>()
  for (const s of suggested) if (s.trim()) set.add(s.trim())
  for (const e of existing) if (e.trim()) set.add(e.trim())
  return [...set]
}
