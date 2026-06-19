package com.ellink.material.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Gemini 자동 분류 결과 (legacy runGeminiAnalysis JSON 스키마와 동일).
 * keywords는 콤마 구분 문자열(설계 결정), partnerCompany는 없으면 "없음".
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record MaterialAnalysis(
        String category,
        String title,
        String introduction,
        String partnerCompany,
        String keywords) {
}
