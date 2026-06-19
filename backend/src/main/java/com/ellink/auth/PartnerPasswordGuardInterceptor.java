package com.ellink.auth;

import com.ellink.common.exception.BusinessException;
import com.ellink.common.exception.ErrorCode;
import com.ellink.common.security.AuthPrincipal;
import com.ellink.partner.PartnerRepository;
import com.ellink.partner.entity.Partner;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 파트너 비밀번호 변경 강제 가드.
 * PARTNER 토큰으로 보호 경로(/api/partner/**, auth 제외) 접근 시 DB 상태를 확인해
 * - mustChangePassword=true → 403 PASSWORD_CHANGE_REQUIRED
 * - DISABLED(토큰 유효기간 내 비활성화된 계정) → 403 ACCOUNT_DISABLED
 * 예외는 GlobalExceptionHandler가 공통 포맷으로 변환한다.
 * 변경/로그인 경로(/api/partner/auth/**)는 WebConfig에서 제외된다.
 */
@Component
public class PartnerPasswordGuardInterceptor implements HandlerInterceptor {

    private final PartnerRepository partnerRepository;

    public PartnerPasswordGuardInterceptor(PartnerRepository partnerRepository) {
        this.partnerRepository = partnerRepository;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthPrincipal principal)) {
            return true; // 미인증 요청은 Security가 401로 처리
        }
        if (!"PARTNER".equals(principal.role())) {
            return true;
        }
        Partner partner = partnerRepository.findById(principal.id())
                .orElseThrow(() -> new BusinessException(ErrorCode.PARTNER_NOT_FOUND));
        if (partner.isDisabled()) {
            throw new BusinessException(ErrorCode.ACCOUNT_DISABLED);
        }
        if (partner.isMustChangePassword()) {
            throw new BusinessException(ErrorCode.PASSWORD_CHANGE_REQUIRED);
        }
        return true;
    }
}
