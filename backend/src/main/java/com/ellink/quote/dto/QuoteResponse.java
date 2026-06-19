package com.ellink.quote.dto;

import com.ellink.quote.QuoteStatus;
import com.ellink.quote.entity.Quote;
import com.ellink.quote.entity.QuoteItem;

import java.time.Instant;
import java.time.ZoneId;
import java.util.List;

/**
 * 견적 단건 상세. 금액 분해(라인합/기업이윤/공급가액/VAT/합계)와 발주처·유효기간 포함.
 */
public record QuoteResponse(
        Long id,
        Long partnerId,
        String partnerCompanyName,
        String clientCompanyName,
        long subtotalSum,
        long companyProfit,
        long supplyAmount,
        long vat,
        long totalAmount,
        QuoteStatus status,
        Instant createdAt,
        Instant issuedAt,
        /** 발급일 + 1개월(KST). 미발급이면 null. */
        Instant validUntil,
        List<ItemInfo> items) {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    public record ItemInfo(
            Long id,
            Long catalogId,
            String itemName,
            long unitPrice,
            int quantity,
            int days,
            long subtotal,
            int orderIndex) {

        static ItemInfo from(QuoteItem i) {
            return new ItemInfo(
                    i.getId(),
                    i.getCatalog() != null ? i.getCatalog().getId() : null,
                    i.getItemName(), i.getUnitPrice(), i.getQuantity(), i.getDays(),
                    i.getSubtotal(), i.getOrderIndex());
        }
    }

    public static QuoteResponse from(Quote q) {
        Instant validUntil = q.getIssuedAt() != null
                ? q.getIssuedAt().atZone(KST).plusMonths(1).toInstant()
                : null;
        return new QuoteResponse(
                q.getId(), q.getPartner().getId(), q.getPartner().getCompanyName(),
                q.getClientCompanyName(),
                q.getSubtotalSum(), q.getCompanyProfit(), q.getSupplyAmount(), q.getVat(),
                q.getTotalAmount(), q.getStatus(), q.getCreatedAt(), q.getIssuedAt(), validUntil,
                q.getItems().stream().map(ItemInfo::from).toList());
    }
}
