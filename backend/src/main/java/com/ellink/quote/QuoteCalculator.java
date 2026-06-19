package com.ellink.quote;

/**
 * 견적 총계 계산(legacy 견적식 이식). 라인합 → 기업이윤 10% → 공급가액 → VAT 10% → 합계.
 * 각 단계 원 단위 반올림. 라인 단가/소계는 스냅샷이므로 카탈로그 변동과 무관.
 */
public final class QuoteCalculator {

    private QuoteCalculator() {
    }

    /** 견적 금액 분해(스냅샷 컬럼으로 저장됨). */
    public record Breakdown(
            long subtotalSum,    // 라인합 Σ(단가×수량×일수)
            long companyProfit,  // 기업이윤 = round(라인합 × 0.1)
            long supplyAmount,   // 공급가액 = 라인합 + 기업이윤
            long vat,            // 부가세 = round(공급가액 × 0.1)
            long totalAmount) {  // 합계 = 공급가액 + 부가세
    }

    /** 라인 소계 = 단가 × 수량 × 일수. */
    public static long lineSubtotal(long unitPrice, int quantity, int days) {
        return unitPrice * quantity * (long) days;
    }

    public static Breakdown of(long subtotalSum) {
        long companyProfit = Math.round(subtotalSum * 0.1);
        long supplyAmount = subtotalSum + companyProfit;
        long vat = Math.round(supplyAmount * 0.1);
        long totalAmount = supplyAmount + vat;
        return new Breakdown(subtotalSum, companyProfit, supplyAmount, vat, totalAmount);
    }
}
