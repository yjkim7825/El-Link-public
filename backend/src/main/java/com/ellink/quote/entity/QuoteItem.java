package com.ellink.quote.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * 견적 라인. catalog는 nullable(커스텀 항목/카탈로그 삭제 대비). itemName/unitPrice는
 * 발급 시점 스냅샷이며, subtotal = unitPrice × quantity 도 저장(재현 보장).
 */
@Entity
@Table(name = "quote_item")
public class QuoteItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quote_id", nullable = false)
    private Quote quote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "catalog_id")
    private PriceCatalog catalog;

    @Column(nullable = false)
    private String itemName;

    /** 발급 시점 단가 복사본. */
    @Column(nullable = false)
    private long unitPrice;

    @Column(nullable = false)
    private int quantity;

    /** 일수(legacy 견적식). 기본 1. subtotal = 단가 × 수량 × 일수. */
    @Column(nullable = false)
    private int days;

    @Column(nullable = false)
    private long subtotal;

    @Column(nullable = false)
    private int orderIndex;

    protected QuoteItem() {
    }

    QuoteItem(Quote quote, PriceCatalog catalog, String itemName, long unitPrice,
              int quantity, int days, int orderIndex) {
        this.quote = quote;
        this.catalog = catalog;
        this.itemName = itemName;
        this.unitPrice = unitPrice;
        this.quantity = quantity;
        this.days = days;
        this.subtotal = com.ellink.quote.QuoteCalculator.lineSubtotal(unitPrice, quantity, days);
        this.orderIndex = orderIndex;
    }

    public Long getId() {
        return id;
    }

    public Quote getQuote() {
        return quote;
    }

    public PriceCatalog getCatalog() {
        return catalog;
    }

    public String getItemName() {
        return itemName;
    }

    public long getUnitPrice() {
        return unitPrice;
    }

    public int getQuantity() {
        return quantity;
    }

    public int getDays() {
        return days;
    }

    public long getSubtotal() {
        return subtotal;
    }

    public int getOrderIndex() {
        return orderIndex;
    }
}
