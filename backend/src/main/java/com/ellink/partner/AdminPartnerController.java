package com.ellink.partner;

import com.ellink.common.response.ApiResponse;
import com.ellink.common.security.AuthPrincipal;
import com.ellink.partner.dto.PartnerCreateRequest;
import com.ellink.partner.dto.PartnerCreateResponse;
import com.ellink.partner.dto.PartnerStatusUpdateRequest;
import com.ellink.partner.dto.PartnerSummary;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 관리자용 파트너 관리 API. /api/admin/** 은 SecurityConfig에서 ROLE_ADMIN으로 제한된다.
 */
@RestController
@RequestMapping("/api/admin/partners")
public class AdminPartnerController {

    private final PartnerService partnerService;

    public AdminPartnerController(PartnerService partnerService) {
        this.partnerService = partnerService;
    }

    @PostMapping
    public ApiResponse<PartnerCreateResponse> create(@AuthenticationPrincipal AuthPrincipal principal,
                                                     @Valid @RequestBody PartnerCreateRequest req) {
        return ApiResponse.ok(partnerService.create(principal.id(), req));
    }

    @GetMapping
    public ApiResponse<List<PartnerSummary>> list() {
        return ApiResponse.ok(partnerService.list());
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<PartnerSummary> updateStatus(@PathVariable Long id,
                                                    @Valid @RequestBody PartnerStatusUpdateRequest req) {
        return ApiResponse.ok(partnerService.updateStatus(id, req.status()));
    }
}
