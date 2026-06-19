package com.ellink.common.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

/**
 * access / refresh JWT 발급 및 검증. 클레임: sub(=사용자 id), email, role, type(access|refresh).
 */
@Component
public class JwtTokenProvider {

    public static final String TYPE_ACCESS = "access";
    public static final String TYPE_REFRESH = "refresh";

    private final SecretKey key;
    private final long accessValiditySeconds;
    private final long refreshValiditySeconds;

    public JwtTokenProvider(
            @Value("${ellink.jwt.secret}") String secret,
            @Value("${ellink.jwt.access-token-validity-seconds}") long accessValiditySeconds,
            @Value("${ellink.jwt.refresh-token-validity-seconds}") long refreshValiditySeconds) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessValiditySeconds = accessValiditySeconds;
        this.refreshValiditySeconds = refreshValiditySeconds;
    }

    public String createAccessToken(Long userId, String email, String role) {
        return build(userId, email, role, TYPE_ACCESS, accessValiditySeconds);
    }

    public String createRefreshToken(Long userId, String email, String role) {
        return build(userId, email, role, TYPE_REFRESH, refreshValiditySeconds);
    }

    private String build(Long userId, String email, String role, String type, long validitySeconds) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("email", email)
                .claim("role", role)
                .claim("type", type)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(validitySeconds)))
                .signWith(key)
                .compact();
    }

    public Jws<Claims> parse(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
    }

    public boolean isValid(String token) {
        try {
            parse(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public AuthPrincipal toPrincipal(Claims claims) {
        return new AuthPrincipal(
                Long.valueOf(claims.getSubject()),
                claims.get("email", String.class),
                claims.get("role", String.class));
    }

    public long getAccessValiditySeconds() {
        return accessValiditySeconds;
    }

    public long getRefreshValiditySeconds() {
        return refreshValiditySeconds;
    }
}
