package com.ellink.common.exception;

import org.springframework.http.HttpStatus;

/**
 * 도메인 에러 코드 ↔ HTTP 상태 매핑.
 * GlobalExceptionHandler가 이 매핑을 사용한다.
 */
public enum ErrorCode {

    // 공통
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "요청 값이 올바르지 않습니다."),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "인증이 필요합니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "접근 권한이 없습니다."),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다."),

    // 인증
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다."),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "유효하지 않은 토큰입니다."),
    PASSWORD_CHANGE_REQUIRED(HttpStatus.FORBIDDEN, "최초 로그인 시 비밀번호를 변경해야 합니다."),
    ACCOUNT_DISABLED(HttpStatus.FORBIDDEN, "비활성화된 계정입니다."),

    // 파트너
    PARTNER_NOT_FOUND(HttpStatus.NOT_FOUND, "파트너를 찾을 수 없습니다."),
    DUPLICATE_EMAIL(HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다."),

    // 자료 / 제안
    MATERIAL_NOT_FOUND(HttpStatus.NOT_FOUND, "자료를 찾을 수 없습니다."),
    PROPOSAL_NOT_FOUND(HttpStatus.NOT_FOUND, "협업 아이디어 추천을 찾을 수 없습니다."),
    FILE_NOT_FOUND(HttpStatus.NOT_FOUND, "파일을 찾을 수 없습니다."),

    // 견적 / 카탈로그
    QUOTE_NOT_FOUND(HttpStatus.NOT_FOUND, "견적을 찾을 수 없습니다."),
    CLIENT_COMPANY_REQUIRED(HttpStatus.BAD_REQUEST, "발급하려면 발주처(고객사명)를 입력해야 합니다."),
    CATALOG_ITEM_NOT_FOUND(HttpStatus.NOT_FOUND, "단가 항목을 찾을 수 없습니다."),

    // 서류
    DOCUMENT_NOT_FOUND(HttpStatus.NOT_FOUND, "서류를 찾을 수 없습니다."),

    // 외부 / 저장소
    GEMINI_ERROR(HttpStatus.BAD_GATEWAY, "AI 분석 호출에 실패했습니다."),
    STORAGE_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "파일 저장소 처리에 실패했습니다.");

    private final HttpStatus status;
    private final String defaultMessage;

    ErrorCode(HttpStatus status, String defaultMessage) {
        this.status = status;
        this.defaultMessage = defaultMessage;
    }

    public HttpStatus status() {
        return status;
    }

    public String defaultMessage() {
        return defaultMessage;
    }
}
