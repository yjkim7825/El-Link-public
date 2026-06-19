package com.ellink.auth.dto;

/**
 * 로그인 성공 응답 본문. refresh 토큰은 별도 httpOnly 쿠키로 내려가므로 여기 포함하지 않는다.
 */
public record LoginResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        boolean mustChangePassword,
        UserSummary user) {
}
