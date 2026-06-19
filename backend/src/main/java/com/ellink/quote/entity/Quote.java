package com.ellink.quote.entity;

import com.ellink.common.audit.BaseTimeEntity;
import com.ellink.partner.entity.Partner;
import com.ellink.quote.QuoteStatus;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * 견적서 헤더. totalAmount는 서버가 라인 소계 합으로 재계산해 저장한다(프론트 값 신뢰 금지).
 * 라인의 unitPrice는 발급 시점 스냅샷이라 카탈로그 단가가 바뀌어도 과거 견적 금액이 재현된다.
 */
@Entity
@Table(name = "quote")
public class Quote extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partner_id", nullable = false)
    private Partner partner;

    /** 발주처(고객사명). DRAFT에선 null 가능, 발급 시 필수. */
    private String clientCompanyName;

    /** 라인합 Σ(단가×수량×일수). */
    @Column(nullable = false)
    private long subtotalSum;

    /** 기업이윤(라인합의 10%). */
    @Column(nullable = false)
    private long companyProfit;

    /** 공급가액(라인합 + 기업이윤). */
    @Column(nullable = false)
    private long supplyAmount;

    /** 부가세(공급가액의 10%). */
    @Column(nullable = false)
    private long vat;

    /** 합계(공급가액 + 부가세). */
    @Column(nullable = false)
    private long totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuoteStatus status;

    /** PDF 발급 시각. DRAFT면 null. */
    private Instant issuedAt;

    /** 발급된 견적서 PDF의 스토리지 key. DRAFT면 null. 클라이언트에는 노출하지 않는다. */
    private String pdfFileKey;

    @OneToMany(mappedBy = "quote", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex asc")
    private List<QuoteItem> items = new ArrayList<>();

    protected Quote() {
    }

    public Quote(Partner partner) {
        this.partner = partner;
        this.status = QuoteStatus.DRAFT;
        this.totalAmount = 0;
    }

    /** 발주처 지정/수정. */
    public void setClientCompanyName(String clientCompanyName) {
        this.clientCompanyName = clientCompanyName;
    }

    /** 라인 추가(양방향 일관성 유지). orderIndex는 추가 순서. days 기본 1. */
    public QuoteItem addItem(PriceCatalog catalog, String itemName, long unitPrice, int quantity, int days) {
        QuoteItem item = new QuoteItem(this, catalog, itemName, unitPrice, quantity, days, this.items.size());
        this.items.add(item);
        return item;
    }

    /** 라인 소계 합 → 기업이윤/공급가액/VAT/합계 재계산(legacy 견적식). */
    public void recalculateTotal() {
        long sum = this.items.stream().mapToLong(QuoteItem::getSubtotal).sum();
        com.ellink.quote.QuoteCalculator.Breakdown b = com.ellink.quote.QuoteCalculator.of(sum);
        this.subtotalSum = b.subtotalSum();
        this.companyProfit = b.companyProfit();
        this.supplyAmount = b.supplyAmount();
        this.vat = b.vat();
        this.totalAmount = b.totalAmount();
    }

    /** 발급 처리 — 상태 ISSUED, 발급 시각/PDF key 기록. */
    public void markIssued(Instant when, String pdfFileKey) {
        this.status = QuoteStatus.ISSUED;
        this.issuedAt = when;
        this.pdfFileKey = pdfFileKey;
    }

    public boolean isIssued() {
        return this.status == QuoteStatus.ISSUED;
    }

    public Long getId() {
        return id;
    }

    public Partner getPartner() {
        return partner;
    }

    public String getClientCompanyName() {
        return clientCompanyName;
    }

    public long getSubtotalSum() {
        return subtotalSum;
    }

    public long getCompanyProfit() {
        return companyProfit;
    }

    public long getSupplyAmount() {
        return supplyAmount;
    }

    public long getVat() {
        return vat;
    }

    public long getTotalAmount() {
        return totalAmount;
    }

    public QuoteStatus getStatus() {
        return status;
    }

    public Instant getIssuedAt() {
        return issuedAt;
    }

    public String getPdfFileKey() {
        return pdfFileKey;
    }

    public List<QuoteItem> getItems() {
        return items;
    }
}
