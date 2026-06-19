package com.ellink.proposal.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * 협업 제안 아이디어(한 Proposal당 보통 3개). relatedMaterialIds는 설계 결정에 따라
 * 콤마 구분 문자열(예: "3,7,12")로 보관한다.
 */
@Entity
@Table(name = "proposal_idea")
public class ProposalIdea {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proposal_id", nullable = false)
    private Proposal proposal;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    /** 관련 Material id의 콤마 구분 문자열. 없으면 null. */
    private String relatedMaterialIds;

    @Column(nullable = false)
    private int orderIndex;

    protected ProposalIdea() {
    }

    ProposalIdea(Proposal proposal, String title, String description, String relatedMaterialIds, int orderIndex) {
        this.proposal = proposal;
        this.title = title;
        this.description = description;
        this.relatedMaterialIds = relatedMaterialIds;
        this.orderIndex = orderIndex;
    }

    public Long getId() {
        return id;
    }

    public Proposal getProposal() {
        return proposal;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getRelatedMaterialIds() {
        return relatedMaterialIds;
    }

    public int getOrderIndex() {
        return orderIndex;
    }
}
