package com.ellink.quote.entity;

import com.ellink.common.audit.BaseTimeEntity;
import com.ellink.quote.PriceType;
import com.ellink.quote.QuoteCategory;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * 단가 카탈로그(관리자 CRUD). 단가 변경 이력은 updatedAt + 견적측 스냅샷으로만 관리(설계 결정).
 * 삭제는 soft delete(isActive=false) — 과거 견적의 스냅샷에는 영향 없음.
 */
@Entity
@Table(name = "price_catalog")
public class PriceCatalog extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuoteCategory category;

    @Column(nullable = false)
    private String itemName;

    /** 원. priceType=CUSTOM이면 0(견적 작성 시 입력). */
    @Column(nullable = false)
    private long unitPrice;

    /** 단위 표기(예: "개", "명", "인", "회", "식"). */
    @Column(nullable = false)
    private String unit;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PriceType priceType;

    @Column(nullable = false)
    private boolean isActive = true;

    protected PriceCatalog() {
    }

    public PriceCatalog(QuoteCategory category, String itemName, long unitPrice, String unit, PriceType priceType) {
        this.category = category;
        this.itemName = itemName;
        this.unitPrice = unitPrice;
        this.unit = unit;
        this.priceType = priceType;
        this.isActive = true;
    }

    /** PATCH 부분 수정. null 인자는 무시. */
    public void update(QuoteCategory category, String itemName, Long unitPrice,
                       String unit, PriceType priceType, Boolean isActive) {
        if (category != null) {
            this.category = category;
        }
        if (itemName != null) {
            this.itemName = itemName;
        }
        if (unitPrice != null) {
            this.unitPrice = unitPrice;
        }
        if (unit != null) {
            this.unit = unit;
        }
        if (priceType != null) {
            this.priceType = priceType;
        }
        if (isActive != null) {
            this.isActive = isActive;
        }
    }

    /** soft delete. */
    public void deactivate() {
        this.isActive = false;
    }

    public Long getId() {
        return id;
    }

    public QuoteCategory getCategory() {
        return category;
    }

    public String getItemName() {
        return itemName;
    }

    public long getUnitPrice() {
        return unitPrice;
    }

    public String getUnit() {
        return unit;
    }

    public PriceType getPriceType() {
        return priceType;
    }

    public boolean isActive() {
        return isActive;
    }
}
