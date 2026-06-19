package com.ellink.partner;

import com.ellink.common.response.ApiResponse;
import com.ellink.common.security.AuthPrincipal;
import com.ellink.partner.dto.PartnerMeResponse;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 파트너 본인 정보 조회. PartnerPasswordGuardInterceptor의 보호 대상
 * (mustChangePassword=true면 403 PASSWORD_CHANGE_REQUIRED).
 */
@RestController
public class PartnerMeController {

    private final PartnerService partnerService;

    public PartnerMeController(PartnerService partnerService) {
        this.partnerService = partnerService;
    }

    @GetMapping("/api/partner/me")
    public ApiResponse<PartnerMeResponse> me(@AuthenticationPrincipal AuthPrincipal principal) {
        return ApiResponse.ok(partnerService.getMe(principal.id()));
    }
}
