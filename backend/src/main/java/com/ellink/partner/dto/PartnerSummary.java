package com.ellink.partner.dto;

import com.ellink.partner.PartnerStatus;
import com.ellink.partner.entity.Partner;

import java.time.Instant;

/**
 * 관리자 화면용 파트너 요약(목록/상태변경 응답).
 */
public record PartnerSummary(
        Long id,
        String email,
        String companyName,
        String contactName,
        String phone,
        PartnerStatus status,
        boolean mustChangePassword,
        Instant lastLoginAt,
        Instant createdAt) {

    public static PartnerSummary from(Partner partner) {
        return new PartnerSummary(
                partner.getId(),
                partner.getEmail(),
                partner.getCompanyName(),
                partner.getContactName(),
                partner.getPhone(),
                partner.getStatus(),
                partner.isMustChangePassword(),
                partner.getLastLoginAt(),
                partner.getCreatedAt());
    }
}
