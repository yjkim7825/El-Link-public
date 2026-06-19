package com.ellink.proposal.entity;

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
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

import java.util.ArrayList;
import java.util.List;

/**
 * 협업 제안. 관리자가 후보 기업명을 입력하면 Gemini 2단계 분석(기업조사 + 아이디어)으로 생성되며,
 * 관리자가 검토/확정한 결과를 저장한다.
 */
@Entity
@Table(name = "proposal")
public class Proposal extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String targetCompanyName;

    /** 1단계 기업 조사 결과(마크다운). */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String companyAnalysis;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private AdminUser createdBy;

    @OneToMany(mappedBy = "proposal", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex asc")
    private List<ProposalIdea> ideas = new ArrayList<>();

    protected Proposal() {
    }

    public Proposal(String targetCompanyName, String companyAnalysis, AdminUser createdBy) {
        this.targetCompanyName = targetCompanyName;
        this.companyAnalysis = companyAnalysis;
        this.createdBy = createdBy;
    }

    /** 아이디어 추가(양방향 일관성 유지). orderIndex는 추가 순서로 부여. */
    public ProposalIdea addIdea(String title, String description, String relatedMaterialIds) {
        ProposalIdea idea = new ProposalIdea(this, title, description, relatedMaterialIds, this.ideas.size());
        this.ideas.add(idea);
        return idea;
    }

    public Long getId() {
        return id;
    }

    public String getTargetCompanyName() {
        return targetCompanyName;
    }

    public String getCompanyAnalysis() {
        return companyAnalysis;
    }

    public AdminUser getCreatedBy() {
        return createdBy;
    }

    public List<ProposalIdea> getIdeas() {
        return ideas;
    }
}
