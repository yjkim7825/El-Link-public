package com.ellink.quote.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/**
 * 견적 생성 요청. totalAmount는 받지 않는다 — 서버가 라인 소계 합으로 재계산한다.
 */
public record QuoteCreateRequest(
        /** 발주처(고객사명). 임시저장 시 선택, 발급 시 필수. */
        String clientCompanyName,
        @NotEmpty @Valid List<QuoteItemRequest> items) {
}
