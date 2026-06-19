package com.ellink.material.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * analyze 단계에서 저장된 파일의 메타데이터. 클라이언트가 확정 저장 시 그대로 돌려보낸다.
 */
public record MaterialFileRef(
        @NotBlank String fileKey,
        @NotBlank String originalName,
        String mimeType,
        long size) {
}
