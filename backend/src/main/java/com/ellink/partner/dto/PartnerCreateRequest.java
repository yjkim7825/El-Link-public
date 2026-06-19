package com.ellink.partner.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * 관리자에 의한 파트너 등록 요청. 비밀번호는 받지 않고 서버가 임시 비밀번호를 발급한다.
 */
public record PartnerCreateRequest(
        @NotBlank @Email String email,
        @NotBlank String companyName,
        @NotBlank String contactName,
        String phone) {
}
