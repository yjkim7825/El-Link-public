package com.ellink.document.dto;

import com.ellink.document.CompanyDocType;
import com.ellink.document.entity.DocumentIssue;

import java.time.Instant;

/**
 * 발급 이력 응답(관리자). fetch join으로 로드한 파트너/문서 정보를 함께 노출한다.
 */
public record IssueResponse(
        Long id,
        Long documentId,
        String documentTitle,
        CompanyDocType documentType,
        Long partnerId,
        String partnerCompanyName,
        String partnerContactName,
        Instant issuedAt) {

    public static IssueResponse from(DocumentIssue i) {
        return new IssueResponse(
                i.getId(),
                i.getDocument().getId(),
                i.getDocument().getTitle(),
                i.getDocument().getType(),
                i.getPartner().getId(),
                i.getPartner().getCompanyName(),
                i.getPartner().getContactName(),
                i.getIssuedAt());
    }
}
