package com.ellink.partner;

/**
 * 파트너 계정 상태. INVITED(등록됨, 최초 로그인 전) → ACTIVE → DISABLED(비활성).
 */
public enum PartnerStatus {
    INVITED,
    ACTIVE,
    DISABLED
}
