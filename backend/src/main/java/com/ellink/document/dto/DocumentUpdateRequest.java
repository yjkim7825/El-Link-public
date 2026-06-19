package com.ellink.document.dto;

/**
 * 문서 부분 수정(PATCH). title/isActive 선택적 — null이면 유지.
 */
public record DocumentUpdateRequest(
        String title,
        Boolean isActive) {
}
