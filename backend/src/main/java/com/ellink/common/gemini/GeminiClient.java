package com.ellink.common.gemini;

import com.ellink.common.exception.BusinessException;
import com.ellink.common.exception.ErrorCode;
import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * Gemini generateContent 호출 중앙화 (legacy GAS callGeminiApi 대응).
 * API 키는 환경변수 GEMINI_API_KEY → ellink.gemini.api-key 로 주입되며
 * URL 쿼리 대신 x-goog-api-key 헤더로 전달한다(로그/URL 노출 방지).
 */
@Component
public class GeminiClient {

    private static final Logger log = LoggerFactory.getLogger(GeminiClient.class);
    private static final Duration TIMEOUT = Duration.ofSeconds(60);

    private final WebClient geminiWebClient;
    private final String apiKey;
    private final String model;

    public GeminiClient(WebClient geminiWebClient,
                        @Value("${ellink.gemini.api-key}") String apiKey,
                        @Value("${ellink.gemini.model}") String model) {
        this.geminiWebClient = geminiWebClient;
        this.apiKey = apiKey;
        this.model = model;
    }

    /**
     * JSON 응답 모드 호출 (responseMimeType: application/json).
     * parts 예: {"text": ...} 또는 {"inline_data": {"mime_type": ..., "data": base64}}
     *
     * @return 모델이 생성한 JSON 문자열
     */
    public String generateJson(List<Map<String, Object>> parts) {
        // thinkingBudget=0: 분류 작업엔 thinking 불필요. 2.5 thinking은 토큰을 크게 소모해
        // 무료 티어 분당 쿼터를 빠르게 소진하고 출력을 잘라 JSON 파싱을 깨뜨린다.
        return call(Map.of(
                "contents", List.of(Map.of("parts", parts)),
                "generationConfig", Map.of(
                        "responseMimeType", "application/json",
                        "thinkingConfig", Map.of("thinkingBudget", 0))));
    }

    /** 단순 텍스트 프롬프트 호출 (legacy callGeminiWithText 대응). thinking 비활성화. */
    public String generateText(String prompt) {
        return call(Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                "generationConfig", Map.of(
                        "thinkingConfig", Map.of("thinkingBudget", 0))));
    }

    private String call(Map<String, Object> requestBody) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new BusinessException(ErrorCode.GEMINI_ERROR, "GEMINI_API_KEY가 설정되지 않았습니다.");
        }
        JsonNode response;
        try {
            response = geminiWebClient.post()
                    .uri("/models/{model}:generateContent", model)
                    .header("x-goog-api-key", apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block(TIMEOUT);
        } catch (WebClientResponseException e) {
            log.error("Gemini API 오류 (HTTP {}): {}", e.getStatusCode().value(), e.getResponseBodyAsString());
            throw new BusinessException(ErrorCode.GEMINI_ERROR,
                    "AI 분석 호출에 실패했습니다. (HTTP " + e.getStatusCode().value() + ")");
        } catch (RuntimeException e) {
            log.error("Gemini API 호출 실패", e);
            throw new BusinessException(ErrorCode.GEMINI_ERROR);
        }

        JsonNode text = (response == null)
                ? null
                : response.at("/candidates/0/content/parts/0/text");
        if (text == null || text.isMissingNode() || !text.isTextual()) {
            log.error("Gemini 응답 구조 이상: {}", response);
            throw new BusinessException(ErrorCode.GEMINI_ERROR, "AI로부터 유효한 응답을 받지 못했습니다.");
        }
        return text.asText();
    }
}
