package com.ellink.quote.dto;

import com.ellink.quote.PriceType;
import com.ellink.quote.QuoteCategory;
import jakarta.validation.constraints.PositiveOrZero;

/**
 * 카탈로그 부분 수정(PATCH). 모든 필드 선택적 — null이면 해당 항목 유지.
 */
public record CatalogUpdateRequest(
        QuoteCategory category,
        String itemName,
        @PositiveOrZero Long unitPrice,
        String unit,
        PriceType priceType,
        Boolean isActive) {
}
