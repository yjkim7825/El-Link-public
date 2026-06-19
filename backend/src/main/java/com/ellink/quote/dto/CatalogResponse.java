package com.ellink.quote.dto;

import com.ellink.quote.PriceType;
import com.ellink.quote.QuoteCategory;
import com.ellink.quote.entity.PriceCatalog;

import java.time.Instant;

/**
 * 카탈로그 응답(관리자/파트너 공통).
 */
public record CatalogResponse(
        Long id,
        QuoteCategory category,
        String itemName,
        long unitPrice,
        String unit,
        PriceType priceType,
        boolean isActive,
        Instant updatedAt) {

    public static CatalogResponse from(PriceCatalog c) {
        return new CatalogResponse(
                c.getId(), c.getCategory(), c.getItemName(), c.getUnitPrice(),
                c.getUnit(), c.getPriceType(), c.isActive(), c.getUpdatedAt());
    }
}
