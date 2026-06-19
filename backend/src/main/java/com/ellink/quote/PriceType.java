package com.ellink.quote;

/**
 * 단가 유형. FIXED(고정 단가 — 스냅샷 시 카탈로그 단가 복사),
 * CUSTOM(입력형 — 기획/디자인/주문제작 등, 견적 작성 시 단가 입력).
 */
public enum PriceType {
    FIXED,
    CUSTOM
}
