package com.ellink.proposal.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * 협업 제안 분석 요청. 후보 기업명만 입력받는다.
 */
public record ProposalAnalyzeRequest(@NotBlank String companyName) {
}
