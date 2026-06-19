package com.ellink.quote.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.PositiveOrZero;

/**
 * 견적 라인 입력. catalogId가 있으면 카탈로그 기반(FIXED는 카탈로그 단가 스냅샷,
 * CUSTOM은 unitPrice 입력값 사용), 없으면 커스텀 라인(itemName/unitPrice 필수).
 * unitPrice는 커스텀/CUSTOM에서만 의미 있으며 서버가 검증·재계산한다.
 */
public record QuoteItemRequest(
        Long catalogId,
        String itemName,
        @PositiveOrZero Long unitPrice,
        @Min(1) int quantity,
        /** 일수. null이면 1로 처리. */
        Integer days) {
}
