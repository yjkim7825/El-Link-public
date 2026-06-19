package com.ellink.material;

import com.ellink.common.response.ApiResponse;
import com.ellink.common.storage.StorageService;
import com.ellink.material.dto.MaterialFileDownload;
import com.ellink.material.dto.MaterialThumbnail;
import com.ellink.material.dto.PortfolioDetail;
import com.ellink.material.dto.PortfolioListItem;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * 파트너용 포트폴리오(EcoLink 자료) 조회/다운로드.
 * /api/partner/** 은 ROLE_PARTNER + 비번변경/비활성 가드 적용.
 * 관리자 전용 정보(fileKey, uploadedBy)는 응답에 노출하지 않는다.
 */
@RestController
@RequestMapping("/api/partner/portfolio")
public class PartnerPortfolioController {

    private final MaterialService materialService;
    private final StorageService storageService;

    public PartnerPortfolioController(MaterialService materialService, StorageService storageService) {
        this.materialService = materialService;
        this.storageService = storageService;
    }

    /** 자료 목록(카테고리/키워드 필터). 경량 응답(파일은 개수만) + thumbnailUrl. */
    @GetMapping
    public ApiResponse<List<PortfolioListItem>> list(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.ok(materialService.listPortfolio(category, keyword));
    }

    /** 자료 상세(fileKey/uploadedBy 제외). */
    @GetMapping("/{id}")
    public ApiResponse<PortfolioDetail> get(@PathVariable Long id) {
        return ApiResponse.ok(materialService.getPortfolio(id));
    }

    /** 대표 이미지(썸네일) 인라인 스트리밍. 없으면 404. */
    @GetMapping("/{id}/thumbnail")
    public ResponseEntity<Resource> thumbnail(@PathVariable Long id) {
        MaterialThumbnail meta = materialService.prepareThumbnail(id);
        Resource resource = storageService.load(meta.fileKey());
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(meta.mimeType()))
                .body(resource);
    }

    /** 첨부 원본 파일 다운로드(스트리밍). 자료/파일 미존재 시 404. */
    @GetMapping("/{id}/files/{fileId}/download")
    public ResponseEntity<Resource> download(@PathVariable Long id, @PathVariable Long fileId) {
        MaterialFileDownload meta = materialService.prepareDownload(id, fileId);
        Resource resource = storageService.load(meta.fileKey());

        MediaType contentType = (meta.mimeType() != null && !meta.mimeType().isBlank())
                ? MediaType.parseMediaType(meta.mimeType())
                : MediaType.APPLICATION_OCTET_STREAM;
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(meta.originalName() != null ? meta.originalName() : "file", StandardCharsets.UTF_8)
                .build();

        return ResponseEntity.ok()
                .contentType(contentType)
                .contentLength(meta.size())
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(resource);
    }
}
