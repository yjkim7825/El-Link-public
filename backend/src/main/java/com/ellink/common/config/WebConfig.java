package com.ellink.common.config;

import com.ellink.auth.PartnerPasswordGuardInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * MVC 인터셉터 등록. 파트너 비밀번호 변경 가드는 파트너 API 전체에 적용하되
 * 로그인/비밀번호 변경 자체(/api/partner/auth/**)는 제외한다.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final PartnerPasswordGuardInterceptor partnerPasswordGuardInterceptor;

    public WebConfig(PartnerPasswordGuardInterceptor partnerPasswordGuardInterceptor) {
        this.partnerPasswordGuardInterceptor = partnerPasswordGuardInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(partnerPasswordGuardInterceptor)
                .addPathPatterns("/api/partner/**")
                .excludePathPatterns("/api/partner/auth/**");
    }
}
