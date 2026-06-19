package com.ellink.common.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.Cookie;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * refresh 토큰을 httpOnly 쿠키로 빌드/파싱/삭제. JS에서 접근 불가.
 * path는 /api/auth로 한정하여 refresh/logout 요청에만 전송된다.
 */
@Component
public class RefreshTokenCookie {

    public static final String NAME = "refreshToken";
    private static final String PATH = "/api/auth";

    private final long maxAgeSeconds;
    private final boolean secure;

    public RefreshTokenCookie(JwtTokenProvider tokenProvider,
                              @Value("${ellink.jwt.refresh-cookie-secure:true}") boolean secure) {
        this.maxAgeSeconds = tokenProvider.getRefreshValiditySeconds();
        this.secure = secure;
    }

    public ResponseCookie create(String refreshToken) {
        return ResponseCookie.from(NAME, refreshToken)
                .httpOnly(true)
                .secure(secure)        // prod=true(HTTPS), dev=false(http://localhost)
                .sameSite("Strict")
                .path(PATH)
                .maxAge(Duration.ofSeconds(maxAgeSeconds))
                .build();
    }

    public ResponseCookie clear() {
        return ResponseCookie.from(NAME, "")
                .httpOnly(true)
                .secure(secure)
                .sameSite("Strict")
                .path(PATH)
                .maxAge(0)
                .build();
    }

    public String read(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return null;
        }
        for (Cookie cookie : request.getCookies()) {
            if (NAME.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
