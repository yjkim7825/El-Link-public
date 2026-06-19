package com.ellink.quote;

import com.ellink.common.response.ApiResponse;
import com.ellink.quote.dto.CatalogCreateRequest;
import com.ellink.quote.dto.CatalogResponse;
import com.ellink.quote.dto.CatalogUpdateRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 관리자용 단가 카탈로그 CRUD. /api/admin/** 은 ROLE_ADMIN 제한.
 */
@RestController
@RequestMapping("/api/admin/catalog")
public class AdminCatalogController {

    private final CatalogService catalogService;

    public AdminCatalogController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping
    public ApiResponse<List<CatalogResponse>> list() {
        return ApiResponse.ok(catalogService.listAll());
    }

    @PostMapping
    public ApiResponse<CatalogResponse> create(@Valid @RequestBody CatalogCreateRequest req) {
        return ApiResponse.ok(catalogService.create(req));
    }

    @PatchMapping("/{id}")
    public ApiResponse<CatalogResponse> update(@PathVariable Long id,
                                               @Valid @RequestBody CatalogUpdateRequest req) {
        return ApiResponse.ok(catalogService.update(id, req));
    }

    /** soft delete (isActive=false). */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        catalogService.deactivate(id);
        return ApiResponse.ok();
    }
}
