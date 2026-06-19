package com.ellink.common.response;

import java.util.Map;

/**
 * 실패 응답의 error 본문.
 * @param code    도메인 에러 코드 (ErrorCode.name())
 * @param message 사용자 표시용 메시지
 * @param fields  검증 실패 시 필드별 메시지 (없으면 null)
 */
public record ApiError(String code, String message, Map<String, String> fields) {

    public static ApiError of(String code, String message) {
        return new ApiError(code, message, null);
    }

    public static ApiError of(String code, String message, Map<String, String> fields) {
        return new ApiError(code, message, fields);
    }
}
