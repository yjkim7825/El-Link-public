package com.ellink.proposal.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/**
 * 협업 제안 확정 저장 요청. analyze 응답을 사용자가 검토/수정한 값.
 */
public record ProposalCreateRequest(
        @NotBlank String targetCompanyName,
        @NotBlank String companyAnalysis,
        @NotEmpty @Valid List<ProposalIdeaPayload> ideas) {
}
