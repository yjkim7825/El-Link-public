package com.ellink.quote.dto;

import com.ellink.quote.QuoteStatus;
import com.ellink.quote.entity.Quote;

import java.time.Instant;

/**
 * 견적 목록 항목(경량).
 */
public record QuoteListItem(
        Long id,
        String clientCompanyName,
        long totalAmount,
        QuoteStatus status,
        int itemCount,
        Instant createdAt,
        Instant issuedAt) {

    public static QuoteListItem from(Quote q) {
        return new QuoteListItem(
                q.getId(), q.getClientCompanyName(), q.getTotalAmount(), q.getStatus(),
                q.getItems().size(), q.getCreatedAt(), q.getIssuedAt());
    }
}
