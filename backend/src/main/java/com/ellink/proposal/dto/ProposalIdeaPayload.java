package com.ellink.proposal.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

/**
 * 아이디어 입출력 공통 형태. analyze 응답(AI 생성)과 create 요청(사용자 확정)에 모두 사용한다.
 * relatedMaterialIds는 관련 Material id 목록(없으면 빈 리스트).
 */
public record ProposalIdeaPayload(
        @NotBlank String title,
        @NotBlank String description,
        List<Long> relatedMaterialIds) {
}
