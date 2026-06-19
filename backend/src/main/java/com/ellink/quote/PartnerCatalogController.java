package com.ellink.quote;

import com.ellink.common.response.ApiResponse;
import com.ellink.quote.dto.CatalogResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 파트너용 카탈로그 조회(활성 품목만). /api/partner/** 은 ROLE_PARTNER + 비번변경 가드 적용.
 */
@RestController
public class PartnerCatalogController {

    private final CatalogService catalogService;

    public PartnerCatalogController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping("/api/partner/catalog")
    public ApiResponse<List<CatalogResponse>> list() {
        return ApiResponse.ok(catalogService.listActive());
    }
}
