package com.ellink.auth.dto;

/**
 * 서비스 → 컨트롤러 전달용. 컨트롤러가 refreshToken을 httpOnly 쿠키로 세팅하고 response만 본문으로 반환한다.
 */
public record LoginBundle(LoginResponse response, String refreshToken) {
}
