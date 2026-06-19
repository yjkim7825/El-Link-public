import type { Role, UserSummary } from '@/types/auth'

interface JwtClaims {
  sub: string
  email: string
  role: Role
  type: string
  exp: number
  iat: number
}

/** 서명 검증 없이 payload만 디코드(클라 표시/라우팅 용도). 보안 판단은 서버가 한다. */
export function decodeJwt(token: string): JwtClaims | null {
  try {
    const payload = token.split('.')[1]
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    const decoded = decodeURIComponent(
      json
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    )
    return JSON.parse(decoded) as JwtClaims
  } catch {
    return null
  }
}

/**
 * 새로고침 복구 시 refresh 응답엔 user가 없으므로, accessToken 클레임으로
 * 최소 UserSummary를 구성한다(id/role만 확실, 이름은 비움).
 */
export function userFromToken(token: string): UserSummary | null {
  const claims = decodeJwt(token)
  if (!claims) return null
  return { id: Number(claims.sub), role: claims.role }
}
