package com.ellink.material.entity;

import com.ellink.admin.entity.AdminUser;
import com.ellink.common.audit.BaseTimeEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

import java.util.ArrayList;
import java.util.List;

/**
 * 협업 자료(포트폴리오 원천 데이터). Gemini 분석 결과를 관리자가 확정해 저장한다.
 * keywords는 설계 결정에 따라 콤마 구분 문자열로 보관한다.
 */
@Entity
@Table(name = "material")
public class Material extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    /** 활동 내용/가치 소개 (Gemini 분석의 introduction). */
    @Column(nullable = false, length = 1000)
    private String summary;

    /** "환경 교육" / "체험" / "봉사" / "업사이클링" */
    @Column(nullable = false)
    private String category;

    /** 콤마 구분 키워드 문자열 (예: "ESG 경영,자원순환,친환경 캠페인"). */
    private String keywords;

    /** 대표 이미지(썸네일) 스토리지 key. 없으면 null. legacy "시트에 표시할 참고 이미지" 대응. */
    private String thumbnailFileKey;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by", nullable = false)
    private AdminUser uploadedBy;

    @OneToMany(mappedBy = "material", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MaterialFile> files = new ArrayList<>();

    protected Material() {
    }

    public Material(String title, String summary, String category, String keywords, AdminUser uploadedBy) {
        this.title = title;
        this.summary = summary;
        this.category = category;
        this.keywords = keywords;
        this.uploadedBy = uploadedBy;
    }

    /** 대표 이미지 지정/교체. */
    public void assignThumbnail(String thumbnailFileKey) {
        this.thumbnailFileKey = thumbnailFileKey;
    }

    /** 첨부 파일 메타데이터 추가 (양방향 연관 일관성 유지). */
    public MaterialFile addFile(String fileKey, String originalName, String mimeType, long size) {
        MaterialFile file = new MaterialFile(this, fileKey, originalName, mimeType, size);
        this.files.add(file);
        return file;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getSummary() {
        return summary;
    }

    public String getCategory() {
        return category;
    }

    public String getKeywords() {
        return keywords;
    }

    public String getThumbnailFileKey() {
        return thumbnailFileKey;
    }

    public AdminUser getUploadedBy() {
        return uploadedBy;
    }

    public List<MaterialFile> getFiles() {
        return files;
    }
}
