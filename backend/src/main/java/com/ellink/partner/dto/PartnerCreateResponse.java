package com.ellink.partner.dto;

/**
 * 파트너 등록 결과. temporaryPassword는 이 응답에서 단 1회만 노출되며
 * 서버는 해시만 보관하므로 다시 조회할 수 없다. (이메일 발송은 운영 단계로 보류)
 */
public record PartnerCreateResponse(
        Long id,
        String email,
        String companyName,
        String temporaryPassword) {
}
