package com.ellink.document;

import com.ellink.common.response.ApiResponse;
import com.ellink.common.security.AuthPrincipal;
import com.ellink.common.storage.StorageService;
import com.ellink.document.dto.DocumentResponse;
import com.ellink.document.dto.DocumentUpdateRequest;
import com.ellink.document.dto.DownloadMeta;
import com.ellink.document.dto.IssueResponse;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;

/**
 * 관리자용 고정 서류 관리 + 발급 이력 조회. /api/admin/** 은 ROLE_ADMIN 제한.
 */
@RestController
@RequestMapping("/api/admin/documents")
public class AdminDocumentController {

    private final DocumentService documentService;
    private final StorageService storageService;

    public AdminDocumentController(DocumentService documentService, StorageService storageService) {
        this.documentService = documentService;
        this.storageService = storageService;
    }

    @GetMapping
    public ApiResponse<List<DocumentResponse>> list() {
        return ApiResponse.ok(documentService.listAll());
    }

    /** 발급 이력 — partnerId/from/to(ISO-8601) 선택 필터. (구체 경로가 /{id}보다 먼저 매칭되도록 별도 경로) */
    @GetMapping("/issues")
    public ApiResponse<List<IssueResponse>> issues(
            @RequestParam(required = false) Long partnerId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to) {
        return ApiResponse.ok(documentService.listIssues(partnerId, from, to));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<DocumentResponse> create(@AuthenticationPrincipal AuthPrincipal principal,
                                                @RequestParam CompanyDocType type,
                                                @RequestParam String title,
                                                @RequestParam("file") MultipartFile file) {
        return ApiResponse.ok(documentService.create(principal.id(), type, title, file));
    }

    /** 관리자 다운로드 — 발급 이력을 남기지 않는다(파트너 다운로드만 기록). 비활성 문서도 가능. */
    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable Long id) {
        DownloadMeta meta = documentService.prepareAdminDownload(id);
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

    @PatchMapping("/{id}")
    public ApiResponse<DocumentResponse> update(@PathVariable Long id,
                                                @Valid @RequestBody DocumentUpdateRequest req) {
        return ApiResponse.ok(documentService.update(id, req));
    }

    /** soft delete (isActive=false). 스토리지 파일은 유지. */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        documentService.deactivate(id);
        return ApiResponse.ok();
    }
}
