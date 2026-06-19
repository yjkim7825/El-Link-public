package com.ellink.document;

import com.ellink.admin.AdminUserRepository;
import com.ellink.admin.entity.AdminUser;
import com.ellink.common.exception.BusinessException;
import com.ellink.common.exception.ErrorCode;
import com.ellink.common.storage.StorageService;
import com.ellink.common.storage.StoredObject;
import com.ellink.document.dto.DocumentResponse;
import com.ellink.document.dto.DocumentUpdateRequest;
import com.ellink.document.dto.DownloadMeta;
import com.ellink.document.dto.IssueResponse;
import com.ellink.document.dto.PartnerDocumentGroup;
import com.ellink.document.entity.CompanyDocument;
import com.ellink.document.entity.DocumentIssue;
import com.ellink.partner.PartnerRepository;
import com.ellink.partner.entity.Partner;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class DocumentService {

    private final CompanyDocumentRepository documentRepository;
    private final DocumentIssueRepository issueRepository;
    private final AdminUserRepository adminUserRepository;
    private final PartnerRepository partnerRepository;
    private final StorageService storageService;

    public DocumentService(CompanyDocumentRepository documentRepository,
                           DocumentIssueRepository issueRepository,
                           AdminUserRepository adminUserRepository,
                           PartnerRepository partnerRepository,
                           StorageService storageService) {
        this.documentRepository = documentRepository;
        this.issueRepository = issueRepository;
        this.adminUserRepository = adminUserRepository;
        this.partnerRepository = partnerRepository;
        this.storageService = storageService;
    }

    // ---------- 관리자 ----------

    @Transactional(readOnly = true)
    public List<DocumentResponse> listAll() {
        return documentRepository.findAllByOrderByTypeAscIdAsc().stream()
                .map(DocumentResponse::from)
                .toList();
    }

    @Transactional
    public DocumentResponse create(Long adminId, CompanyDocType type, String title, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "업로드할 파일이 필요합니다.");
        }
        AdminUser admin = adminUserRepository.findById(adminId)
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
        String originalName = file.getOriginalFilename();
        String mimeType = file.getContentType();
        StoredObject stored = storageService.store(originalName, readBytes(file), mimeType);
        CompanyDocument doc = documentRepository.save(new CompanyDocument(
                type, title, stored.key(), originalName, mimeType, stored.size(), admin));
        return DocumentResponse.from(doc);
    }

    @Transactional
    public DocumentResponse update(Long id, DocumentUpdateRequest req) {
        CompanyDocument doc = findOrThrow(id);
        doc.update(req.title(), req.isActive());
        return DocumentResponse.from(doc);
    }

    /** soft delete — isActive=false. 스토리지 파일은 유지(과거 발급 재현 가능성 위해). */
    @Transactional
    public void deactivate(Long id) {
        findOrThrow(id).deactivate();
    }

    /**
     * 관리자 다운로드 준비 — 발급 이력을 남기지 않는다(파트너 다운로드만 기록).
     * 비활성 문서도 관리자는 다운로드 가능.
     */
    @Transactional(readOnly = true)
    public DownloadMeta prepareAdminDownload(Long id) {
        CompanyDocument doc = findOrThrow(id);
        return new DownloadMeta(doc.getFileKey(), doc.getOriginalName(), doc.getMimeType(), doc.getSize());
    }

    @Transactional(readOnly = true)
    public List<IssueResponse> listIssues(Long partnerId, Instant from, Instant to) {
        return issueRepository.search(partnerId, from, to).stream()
                .map(IssueResponse::from)
                .toList();
    }

    // ---------- 파트너 ----------

    /** 활성 문서만 type별 그룹으로. */
    @Transactional(readOnly = true)
    public List<PartnerDocumentGroup> listActiveGrouped() {
        Map<CompanyDocType, List<PartnerDocumentGroup.Item>> grouped = new LinkedHashMap<>();
        for (CompanyDocument d : documentRepository.findByIsActiveTrueOrderByTypeAscIdAsc()) {
            grouped.computeIfAbsent(d.getType(), k -> new ArrayList<>())
                    .add(PartnerDocumentGroup.Item.from(d));
        }
        List<PartnerDocumentGroup> groups = new ArrayList<>();
        grouped.forEach((type, items) -> groups.add(new PartnerDocumentGroup(type, items)));
        return groups;
    }

    /**
     * 다운로드 준비 — 활성 문서가 아니면 404(존재 노출 안 함), 맞으면 발급 이력 1건 기록 후 메타 반환.
     * 실제 스트리밍은 컨트롤러가 fileKey로 수행한다.
     */
    @Transactional
    public DownloadMeta prepareDownload(Long partnerId, Long documentId) {
        CompanyDocument doc = documentRepository.findById(documentId)
                .filter(CompanyDocument::isActive)
                .orElseThrow(() -> new BusinessException(ErrorCode.DOCUMENT_NOT_FOUND));
        Partner partner = partnerRepository.findById(partnerId)
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
        issueRepository.save(new DocumentIssue(doc, partner));
        return new DownloadMeta(doc.getFileKey(), doc.getOriginalName(), doc.getMimeType(), doc.getSize());
    }

    private CompanyDocument findOrThrow(Long id) {
        return documentRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.DOCUMENT_NOT_FOUND));
    }

    private byte[] readBytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.STORAGE_ERROR, "업로드 파일을 읽지 못했습니다.");
        }
    }
}
