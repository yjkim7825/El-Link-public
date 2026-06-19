package com.ellink.material;

import com.ellink.admin.AdminUserRepository;
import com.ellink.admin.entity.AdminUser;
import com.ellink.common.exception.BusinessException;
import com.ellink.common.exception.ErrorCode;
import com.ellink.common.gemini.GeminiClient;
import com.ellink.common.storage.StorageService;
import com.ellink.common.storage.StoredObject;
import com.ellink.material.dto.MaterialAnalysis;
import com.ellink.material.dto.MaterialAnalyzeResponse;
import com.ellink.material.dto.MaterialCreateRequest;
import com.ellink.material.dto.MaterialFileDownload;
import com.ellink.material.dto.MaterialFileRef;
import com.ellink.material.dto.MaterialListItem;
import com.ellink.material.dto.MaterialResponse;
import com.ellink.material.dto.MaterialThumbnail;
import com.ellink.material.dto.PortfolioDetail;
import com.ellink.material.dto.PortfolioListItem;
import com.ellink.material.entity.Material;
import com.ellink.material.entity.MaterialFile;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class MaterialService {

    /** legacy runGeminiAnalysis 고정 프롬프트와 동일. */
    private static final String CLASSIFY_PROMPT = """
            당신은 업사이클링, 체험 프로그램, 환경 교육 전문가입니다.
            주어진 텍스트 또는 파일을 분석해서 아래 JSON 형식에 맞춰 각 항목을 채워주세요. 모든 답변은 한국어로 작성해야 합니다.
            - category: 내용이 다음 중 어디에 가장 가까운지 하나만 선택하세요: "환경 교육", "체험", "봉사", "업사이클링"
            - title: 내용에 대한 매력적인 제목을 20자 이내로 지어주세요.
            - introduction: 활동 내용과 가치를 100자 이내로 간단하게 소개해주세요.
            - partnerCompany: 내용에 특정 기업이나 기관명이 보인다면 기재해주세요. 없다면 "없음"으로 기재해주세요.
            - keywords: 내용과 관련된 협업 키워드를 3개만 추출해주세요. (예: "ESG 경영", "자원순환", "친환경 캠페인")
            { "category": "", "title": "", "introduction": "", "partnerCompany": "", "keywords": "" }""";

    private final MaterialRepository materialRepository;
    private final AdminUserRepository adminUserRepository;
    private final StorageService storageService;
    private final TextExtractionService textExtractionService;
    private final GeminiClient geminiClient;
    private final ObjectMapper objectMapper;

    public MaterialService(MaterialRepository materialRepository,
                           AdminUserRepository adminUserRepository,
                           StorageService storageService,
                           TextExtractionService textExtractionService,
                           GeminiClient geminiClient,
                           ObjectMapper objectMapper) {
        this.materialRepository = materialRepository;
        this.adminUserRepository = adminUserRepository;
        this.storageService = storageService;
        this.textExtractionService = textExtractionService;
        this.geminiClient = geminiClient;
        this.objectMapper = objectMapper;
    }

    /**
     * 파일/텍스트를 분석한다. 파일이 있으면 원본을 StorageService에 저장하고
     * (PDF/docx/text는 텍스트 추출, 이미지는 inline_data로) Gemini에 넘긴다. DB 저장은 하지 않는다.
     */
    /** 대표 이미지 최대 크기(5MB). */
    private static final long MAX_THUMBNAIL_BYTES = 5L * 1024 * 1024;

    public MaterialAnalyzeResponse analyze(MultipartFile file, String text, MultipartFile representativeImage) {
        boolean hasFile = file != null && !file.isEmpty();
        boolean hasImage = representativeImage != null && !representativeImage.isEmpty();
        if (!hasFile && !StringUtils.hasText(text)) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "분석할 파일 또는 텍스트가 필요합니다.");
        }

        List<Map<String, Object>> parts = new ArrayList<>();
        parts.add(Map.of("text", CLASSIFY_PROMPT));
        if (StringUtils.hasText(text)) {
            parts.add(Map.of("text", "\n\n--- 분석할 텍스트 ---\n" + text));
        }

        MaterialFileRef fileRef = null;
        if (hasFile) {
            byte[] bytes = readBytes(file);
            String mimeType = file.getContentType();
            String originalName = file.getOriginalFilename();

            StoredObject stored = storageService.store(originalName, bytes, mimeType);
            fileRef = new MaterialFileRef(stored.key(), originalName, mimeType, stored.size());

            if (textExtractionService.isImage(mimeType)) {
                parts.add(Map.of("inline_data", Map.of(
                        "mime_type", mimeType,
                        "data", java.util.Base64.getEncoder().encodeToString(bytes))));
            } else {
                String extracted = textExtractionService.extract(bytes, mimeType, originalName);
                if (StringUtils.hasText(extracted)) {
                    parts.add(Map.of("text", "\n\n--- 분석할 파일 내용 ---\n" + extracted));
                }
            }
        }

        // 대표 이미지: 저장(썸네일) + 이미지면 Gemini에도 inline_data로 함께 전달(legacy "참고 이미지" 대응)
        MaterialFileRef thumbRef = null;
        if (hasImage) {
            byte[] imgBytes = readBytes(representativeImage);
            if (imgBytes.length > MAX_THUMBNAIL_BYTES) {
                throw new BusinessException(ErrorCode.VALIDATION_ERROR, "대표 이미지는 5MB 이하만 업로드할 수 있습니다.");
            }
            String imgMime = representativeImage.getContentType();
            if (imgMime == null || !textExtractionService.isImage(imgMime)) {
                throw new BusinessException(ErrorCode.VALIDATION_ERROR, "대표 이미지는 이미지 파일만 가능합니다.");
            }
            String imgName = representativeImage.getOriginalFilename();
            StoredObject storedImg = storageService.store(imgName, imgBytes, imgMime);
            thumbRef = new MaterialFileRef(storedImg.key(), imgName, imgMime, storedImg.size());
            parts.add(Map.of("inline_data", Map.of(
                    "mime_type", imgMime,
                    "data", java.util.Base64.getEncoder().encodeToString(imgBytes))));
        }

        String json = geminiClient.generateJson(parts);
        MaterialAnalysis analysis = parseAnalysis(json);
        return new MaterialAnalyzeResponse(analysis, fileRef, thumbRef);
    }

    /** 분석 결과 확정 저장. files는 analyze에서 받은 메타데이터를 그대로 보관한다. */
    @Transactional
    public MaterialResponse create(Long adminId, MaterialCreateRequest req) {
        AdminUser admin = adminUserRepository.findById(adminId)
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
        Material material = new Material(
                req.title(), req.summary(), req.category(), req.keywords(), admin);
        if (StringUtils.hasText(req.thumbnailFileKey())) {
            material.assignThumbnail(req.thumbnailFileKey());
        }
        if (req.files() != null) {
            for (MaterialFileRef f : req.files()) {
                material.addFile(f.fileKey(), f.originalName(), f.mimeType(), f.size());
            }
        }
        return MaterialResponse.from(materialRepository.save(material));
    }

    @Transactional(readOnly = true)
    public List<MaterialListItem> list(String category, String keyword) {
        return materialRepository.search(blankToNull(category), blankToNull(keyword)).stream()
                .map(MaterialListItem::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public MaterialResponse get(Long id) {
        return MaterialResponse.from(findOrThrow(id));
    }

    /** 파트너 포트폴리오 목록 — 카테고리/키워드 필터. 민감 정보 제외 + thumbnailUrl 포함. */
    @Transactional(readOnly = true)
    public List<PortfolioListItem> listPortfolio(String category, String keyword) {
        return materialRepository.search(blankToNull(category), blankToNull(keyword)).stream()
                .map(PortfolioListItem::from)
                .toList();
    }

    /** 파트너 포트폴리오 상세 — 민감 정보(fileKey/uploadedBy) 제외. */
    @Transactional(readOnly = true)
    public PortfolioDetail getPortfolio(Long id) {
        return PortfolioDetail.from(findOrThrow(id));
    }

    /** 대표 이미지 스트리밍 메타 — 없으면 404. mimeType은 key 확장자로 추론. */
    @Transactional(readOnly = true)
    public MaterialThumbnail prepareThumbnail(Long id) {
        Material material = findOrThrow(id);
        String key = material.getThumbnailFileKey();
        if (key == null) {
            throw new BusinessException(ErrorCode.FILE_NOT_FOUND);
        }
        return new MaterialThumbnail(key, guessImageMime(key));
    }

    private String guessImageMime(String key) {
        String lower = key.toLowerCase();
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".gif")) return "image/gif";
        if (lower.endsWith(".webp")) return "image/webp";
        return "application/octet-stream";
    }

    /** 첨부 파일 다운로드 메타 조회 — 자료/파일 소속을 검증한다. */
    @Transactional(readOnly = true)
    public MaterialFileDownload prepareDownload(Long materialId, Long fileId) {
        Material material = findOrThrow(materialId);
        MaterialFile f = material.getFiles().stream()
                .filter(x -> x.getId().equals(fileId))
                .findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.FILE_NOT_FOUND));
        return new MaterialFileDownload(f.getFileKey(), f.getOriginalName(), f.getMimeType(), f.getSize());
    }

    /** 자료 + 첨부 파일(스토리지 바이트 포함) 삭제. */
    @Transactional
    public void delete(Long id) {
        Material material = findOrThrow(id);
        material.getFiles().forEach(f -> storageService.delete(f.getFileKey()));
        if (material.getThumbnailFileKey() != null) {
            storageService.delete(material.getThumbnailFileKey());
        }
        materialRepository.delete(material);
    }

    private Material findOrThrow(Long id) {
        return materialRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.MATERIAL_NOT_FOUND));
    }

    /**
     * Gemini JSON을 MaterialAnalysis로 변환. keywords는 모델에 따라 문자열 또는 배열로 오므로
     * (1.5=문자열, 2.x=배열) 항상 콤마 구분 문자열로 정규화한다(설계 결정).
     */
    private MaterialAnalysis parseAnalysis(String json) {
        try {
            JsonNode node = objectMapper.readTree(json);
            return new MaterialAnalysis(
                    node.path("category").asText(null),
                    node.path("title").asText(null),
                    node.path("introduction").asText(null),
                    node.path("partnerCompany").asText(null),
                    normalizeKeywords(node.get("keywords")));
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(MaterialService.class)
                    .warn("Gemini 분석 결과 파싱 실패. raw={}", json, e);
            throw new BusinessException(ErrorCode.GEMINI_ERROR, "AI 분석 결과를 해석하지 못했습니다.");
        }
    }

    private String normalizeKeywords(JsonNode keywords) {
        if (keywords == null || keywords.isNull()) {
            return null;
        }
        if (keywords.isArray()) {
            List<String> items = new ArrayList<>();
            keywords.forEach(k -> items.add(k.asText().trim()));
            return String.join(",", items);
        }
        return keywords.asText();
    }

    private byte[] readBytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.STORAGE_ERROR, "업로드 파일을 읽지 못했습니다.");
        }
    }

    private String blankToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
