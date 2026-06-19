package com.ellink.proposal.dto;

import com.ellink.proposal.entity.Proposal;

import java.time.Instant;

/**
 * 협업 제안 목록 항목(경량).
 */
public record ProposalListItem(
        Long id,
        String targetCompanyName,
        int ideaCount,
        Instant createdAt) {

    public static ProposalListItem from(Proposal p) {
        return new ProposalListItem(
                p.getId(), p.getTargetCompanyName(), p.getIdeas().size(), p.getCreatedAt());
    }
}
