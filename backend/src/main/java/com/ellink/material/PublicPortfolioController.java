package com.ellink.material;

import com.ellink.common.response.ApiResponse;
import com.ellink.common.storage.StorageService;
import com.ellink.material.dto.MaterialThumbnail;
import com.ellink.material.dto.PortfolioListItem;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 공개 랜딩(/) 협업 사례 미리보기용 무인증 엔드포인트.
 * /api/public/** 은 SecurityConfig에서 permitAll. 파트너 목록과 동일한 sanitized DTO를
 * 재사용하므로 fileKey/uploadedBy 등 관리자 정보는 노출되지 않는다.
 */
@RestController
@RequestMapping("/api/public/portfolio")
public class PublicPortfolioController {

    private final MaterialService materialService;
    private final StorageService storageService;

    public PublicPortfolioController(MaterialService materialService, StorageService storageService) {
        this.materialService = materialService;
        this.storageService = storageService;
    }

    /** 협업 사례 목록(경량, sanitized). 랜딩에서 상위 몇 건만 노출. */
    @GetMapping
    public ApiResponse<List<PortfolioListItem>> list() {
        return ApiResponse.ok(materialService.listPortfolio(null, null));
    }

    /** 대표 이미지(썸네일) 인라인 스트리밍. 없으면 404 → 프론트는 카테고리 placeholder로 폴백. */
    @GetMapping("/{id}/thumbnail")
    public ResponseEntity<Resource> thumbnail(@PathVariable Long id) {
        MaterialThumbnail meta = materialService.prepareThumbnail(id);
        Resource resource = storageService.load(meta.fileKey());
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(meta.mimeType()))
                .body(resource);
    }
}
