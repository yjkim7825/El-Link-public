package com.ellink.auth.dto;

/**
 * 로그인 응답에 포함되는 사용자 요약. 역할에 따라 일부 필드만 채워진다.
 * (ADMIN: name / PARTNER: companyName, contactName)
 */
public record UserSummary(
        Long id,
        String role,
        String name,
        String companyName,
        String contactName) {

    public static UserSummary admin(Long id, String name) {
        return new UserSummary(id, "ADMIN", name, null, null);
    }

    public static UserSummary partner(Long id, String companyName, String contactName) {
        return new UserSummary(id, "PARTNER", null, companyName, contactName);
    }
}
