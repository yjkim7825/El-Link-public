package com.ellink.material;

import com.ellink.common.response.ApiResponse;
import com.ellink.common.security.AuthPrincipal;
import com.ellink.common.storage.StorageService;
import com.ellink.material.dto.MaterialAnalyzeResponse;
import com.ellink.material.dto.MaterialCreateRequest;
import com.ellink.material.dto.MaterialFileDownload;
import com.ellink.material.dto.MaterialListItem;
import com.ellink.material.dto.MaterialResponse;
import com.ellink.material.dto.MaterialThumbnail;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * 관리자용 자료 관리 API. /api/admin/** 은 ROLE_ADMIN 제한.
 */
@RestController
@RequestMapping("/api/admin/materials")
public class AdminMaterialController {

    private final MaterialService materialService;
    private final StorageService storageService;

    public AdminMaterialController(MaterialService materialService, StorageService storageService) {
        this.materialService = materialService;
        this.storageService = storageService;
    }

    /** 파일/텍스트 → Gemini 분석. DB 저장 없이 분석 결과만 반환(파일 원본은 스토리지에 보관). */
    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<MaterialAnalyzeResponse> analyze(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "text", required = false) String text,
            @RequestParam(value = "representativeImage", required = false) MultipartFile representativeImage) {
        return ApiResponse.ok(materialService.analyze(file, text, representativeImage));
    }

    /** 분석 결과 확정 저장. */
    @PostMapping
    public ApiResponse<MaterialResponse> create(@AuthenticationPrincipal AuthPrincipal principal,
                                                @Valid @RequestBody MaterialCreateRequest req) {
        return ApiResponse.ok(materialService.create(principal.id(), req));
    }

    @GetMapping
    public ApiResponse<List<MaterialListItem>> list(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.ok(materialService.list(category, keyword));
    }

    @GetMapping("/{id}")
    public ApiResponse<MaterialResponse> get(@PathVariable Long id) {
        return ApiResponse.ok(materialService.get(id));
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

    /** 대표 이미지(썸네일) 인라인 스트리밍. 없으면 404. */
    @GetMapping("/{id}/thumbnail")
    public ResponseEntity<Resource> thumbnail(@PathVariable Long id) {
        MaterialThumbnail meta = materialService.prepareThumbnail(id);
        Resource resource = storageService.load(meta.fileKey());
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(meta.mimeType()))
                .body(resource);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        materialService.delete(id);
        return ApiResponse.ok();
    }
}
