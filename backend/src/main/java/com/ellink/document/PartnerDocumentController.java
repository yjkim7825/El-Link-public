package com.ellink.document;

import com.ellink.common.response.ApiResponse;
import com.ellink.common.security.AuthPrincipal;
import com.ellink.common.storage.StorageService;
import com.ellink.document.dto.DownloadMeta;
import com.ellink.document.dto.PartnerDocumentGroup;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * 파트너용 서류 조회/다운로드. /api/partner/** 은 ROLE_PARTNER + 비번변경/비활성 가드 적용.
 */
@RestController
@RequestMapping("/api/partner/documents")
public class PartnerDocumentController {

    private final DocumentService documentService;
    private final StorageService storageService;

    public PartnerDocumentController(DocumentService documentService, StorageService storageService) {
        this.documentService = documentService;
        this.storageService = storageService;
    }

    /** 활성 문서만 type별 그룹으로. */
    @GetMapping
    public ApiResponse<List<PartnerDocumentGroup>> list() {
        return ApiResponse.ok(documentService.listActiveGrouped());
    }

    /**
     * 다운로드 — 발급 이력 1건 기록 후 파일 스트리밍. 비활성/없는 문서는 404.
     * Content-Disposition: attachment; filename(원본명, UTF-8).
     */
    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> download(@AuthenticationPrincipal AuthPrincipal principal,
                                             @PathVariable Long id) {
        DownloadMeta meta = documentService.prepareDownload(principal.id(), id);
        Resource resource = storageService.load(meta.fileKey());

        MediaType contentType = (meta.mimeType() != null && !meta.mimeType().isBlank())
                ? MediaType.parseMediaType(meta.mimeType())
                : MediaType.APPLICATION_OCTET_STREAM;
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename(meta.originalName() != null ? meta.originalName() : "document",
                        StandardCharsets.UTF_8)
                .build();

        return ResponseEntity.ok()
                .contentType(contentType)
                .contentLength(meta.size())
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(resource);
    }
}
