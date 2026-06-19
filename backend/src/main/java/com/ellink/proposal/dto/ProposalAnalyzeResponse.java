package com.ellink.proposal.dto;

import java.util.List;

/**
 * 2단계 Gemini 분석 결과(DB 저장 X). 사용자가 검토/수정 후 확정 저장한다.
 */
public record ProposalAnalyzeResponse(
        String companyName,
        String companyAnalysis,
        List<ProposalIdeaPayload> ideas) {
}
