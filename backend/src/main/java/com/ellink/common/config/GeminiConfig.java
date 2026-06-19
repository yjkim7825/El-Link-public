package com.ellink.common.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Gemini API 호출용 WebClient. 실제 분석 서비스는 material/proposal 도메인에서 사용.
 * API 키는 환경변수(GEMINI_API_KEY)로 주입한다.
 */
@Configuration
public class GeminiConfig {

    @Bean
    public WebClient geminiWebClient(@Value("${ellink.gemini.base-url}") String baseUrl) {
        return WebClient.builder()
                .baseUrl(baseUrl)
                .build();
    }
}
