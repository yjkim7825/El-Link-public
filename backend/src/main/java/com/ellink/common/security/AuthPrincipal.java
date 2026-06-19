package com.ellink.common.security;

/**
 * JWT에서 복원되는 인증 주체. 스테이트리스이므로 요청마다 DB 조회 없이 토큰 클레임으로 구성된다.
 *
 * @param id    AdminUser 또는 Partner의 PK
 * @param email 로그인 이메일
 * @param role  "ADMIN" 또는 "PARTNER"
 */
public record AuthPrincipal(Long id, String email, String role) {
}
