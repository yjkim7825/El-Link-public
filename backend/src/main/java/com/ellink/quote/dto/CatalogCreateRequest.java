package com.ellink.quote.dto;

import com.ellink.quote.PriceType;
import com.ellink.quote.QuoteCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

/**
 * 카탈로그 신규 등록 요청.
 */
public record CatalogCreateRequest(
        @NotNull QuoteCategory category,
        @NotBlank String itemName,
        @NotNull @PositiveOrZero Long unitPrice,
        @NotBlank String unit,
        @NotNull PriceType priceType) {
}
