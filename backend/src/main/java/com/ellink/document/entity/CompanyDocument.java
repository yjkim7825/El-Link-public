package com.ellink.document.entity;

import com.ellink.admin.entity.AdminUser;
import com.ellink.common.audit.BaseTimeEntity;
import com.ellink.document.CompanyDocType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * EcoLink 고정 회사 서류(사업자등록증/통장사본 등). 실제 바이트는 StorageService(fileKey)가 보관하고
 * DB에는 메타데이터만 둔다. 삭제는 soft delete(isActive=false) — 스토리지 파일은 유지한다.
 */
@Entity
@Table(name = "company_document")
public class CompanyDocument extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CompanyDocType type;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String fileKey;

    @Column(nullable = false)
    private String originalName;

    private String mimeType;

    @Column(nullable = false)
    private long size;

    @Column(nullable = false)
    private boolean isActive = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by", nullable = false)
    private AdminUser uploadedBy;

    protected CompanyDocument() {
    }

    public CompanyDocument(CompanyDocType type, String title, String fileKey,
                           String originalName, String mimeType, long size, AdminUser uploadedBy) {
        this.type = type;
        this.title = title;
        this.fileKey = fileKey;
        this.originalName = originalName;
        this.mimeType = mimeType;
        this.size = size;
        this.uploadedBy = uploadedBy;
        this.isActive = true;
    }

    /** PATCH 부분 수정. null 인자는 무시. */
    public void update(String title, Boolean isActive) {
        if (title != null) {
            this.title = title;
        }
        if (isActive != null) {
            this.isActive = isActive;
        }
    }

    public void deactivate() {
        this.isActive = false;
    }

    public Long getId() {
        return id;
    }

    public CompanyDocType getType() {
        return type;
    }

    public String getTitle() {
        return title;
    }

    public String getFileKey() {
        return fileKey;
    }

    public String getOriginalName() {
        return originalName;
    }

    public String getMimeType() {
        return mimeType;
    }

    public long getSize() {
        return size;
    }

    public boolean isActive() {
        return isActive;
    }

    public AdminUser getUploadedBy() {
        return uploadedBy;
    }
}
