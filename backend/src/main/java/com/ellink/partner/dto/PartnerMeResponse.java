package com.ellink.partner.dto;

import com.ellink.partner.PartnerStatus;
import com.ellink.partner.entity.Partner;

import java.time.Instant;

/**
 * 파트너 본인 정보 조회 응답 (GET /api/partner/me).
 */
public record PartnerMeResponse(
        Long id,
        String email,
        String companyName,
        String contactName,
        String phone,
        PartnerStatus status,
        Instant lastLoginAt,
        Instant createdAt) {

    public static PartnerMeResponse from(Partner partner) {
        return new PartnerMeResponse(
                partner.getId(),
                partner.getEmail(),
                partner.getCompanyName(),
                partner.getContactName(),
                partner.getPhone(),
                partner.getStatus(),
                partner.getLastLoginAt(),
                partner.getCreatedAt());
    }
}
