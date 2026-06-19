package com.ellink.material.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

/**
 * 분석 결과 확정 저장 요청. analyze 응답을 사용자가 검토/수정한 값.
 * files는 analyze에서 받은 MaterialFileRef를 그대로(또는 비워서) 전달한다.
 */
public record MaterialCreateRequest(
        @NotBlank String title,
        @NotBlank String summary,
        @NotBlank String category,
        String keywords,
        /** 대표 이미지 스토리지 key(analyze 응답의 thumbnail.fileKey). 없으면 null. */
        String thumbnailFileKey,
        @Valid List<MaterialFileRef> files) {
}
