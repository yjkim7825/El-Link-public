package com.ellink.material.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * 자료 첨부 파일 메타데이터. 실제 바이트는 StorageService(fileKey)가 보관한다.
 */
@Entity
@Table(name = "material_file")
public class MaterialFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "material_id", nullable = false)
    private Material material;

    @Column(nullable = false)
    private String fileKey;

    @Column(nullable = false)
    private String originalName;

    private String mimeType;

    @Column(nullable = false)
    private long size;

    @Column(nullable = false, updatable = false)
    private Instant uploadedAt;

    protected MaterialFile() {
    }

    MaterialFile(Material material, String fileKey, String originalName, String mimeType, long size) {
        this.material = material;
        this.fileKey = fileKey;
        this.originalName = originalName;
        this.mimeType = mimeType;
        this.size = size;
        this.uploadedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Material getMaterial() {
        return material;
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

    public Instant getUploadedAt() {
        return uploadedAt;
    }
}
