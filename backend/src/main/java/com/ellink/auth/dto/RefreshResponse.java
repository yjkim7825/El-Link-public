package com.ellink.auth.dto;

public record RefreshResponse(
        String accessToken,
        String tokenType,
        long expiresIn) {
}
