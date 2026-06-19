export const APP_NAME = 'El-Link'
export const APP_TAGLINE = 'EcoLink 파트너십'

/** 관리자 네비게이션 항목 (사이드바). */
export const ADMIN_NAV = [
  { to: '/admin/materials', label: '자료' },
  { to: '/admin/proposals', label: '협업 추천' },
  { to: '/admin/partners', label: '파트너' },
  { to: '/admin/catalog', label: '단가표' },
  { to: '/admin/documents', label: '서류' },
] as const

/** 파트너 네비게이션 항목. */
export const PARTNER_NAV = [
  { to: '/partner/portfolio', label: '포트폴리오' },
  { to: '/partner/documents', label: '서류 발급' },
  { to: '/partner/quotes', label: '모의 견적' },
  { to: '/partner/account', label: '내 계정' },
] as const
