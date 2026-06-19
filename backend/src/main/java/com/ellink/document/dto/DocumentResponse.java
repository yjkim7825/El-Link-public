package com.ellink.document.dto;

import com.ellink.document.CompanyDocType;
import com.ellink.document.entity.CompanyDocument;

import java.time.Instant;

/**
 * 관리자용 문서 응답. fileKey(스토리지 키)는 내부 식별자라 노출하지 않는다.
 */
public record DocumentResponse(
        Long id,
        CompanyDocType type,
        String title,
        String originalName,
        String mimeType,
        long size,
        boolean isActive,
        String uploadedByName,
        Instant updatedAt) {

    public static DocumentResponse from(CompanyDocument d) {
        return new DocumentResponse(
                d.getId(), d.getType(), d.getTitle(), d.getOriginalName(), d.getMimeType(),
                d.getSize(), d.isActive(), d.getUploadedBy().getName(), d.getUpdatedAt());
    }
}
