package com.ellink.proposal.dto;

import com.ellink.proposal.entity.Proposal;
import com.ellink.proposal.entity.ProposalIdea;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 협업 제안 단건 상세. 아이디어별 관련 자료는 id뿐 아니라 제목까지 해석해서 내려준다
 * (이미 삭제된 자료 id는 relatedMaterials에서 제외).
 */
public record ProposalResponse(
        Long id,
        String targetCompanyName,
        String companyAnalysis,
        String createdByName,
        Instant createdAt,
        List<IdeaInfo> ideas) {

    public record MaterialRef(Long id, String title) {
    }

    public record IdeaInfo(
            Long id,
            String title,
            String description,
            List<Long> relatedMaterialIds,
            List<MaterialRef> relatedMaterials,
            int orderIndex) {
    }

    /** relatedMaterialIds 콤마 문자열 → Long 리스트(빈 값 무시). */
    public static List<Long> parseIds(String csv) {
        List<Long> ids = new ArrayList<>();
        if (csv == null || csv.isBlank()) {
            return ids;
        }
        for (String token : csv.split(",")) {
            String t = token.trim();
            if (!t.isEmpty()) {
                try {
                    ids.add(Long.parseLong(t));
                } catch (NumberFormatException ignored) {
                    // 비정상 토큰은 건너뜀
                }
            }
        }
        return ids;
    }

    public static ProposalResponse from(Proposal p, Map<Long, String> titlesById) {
        List<IdeaInfo> ideas = new ArrayList<>();
        for (ProposalIdea idea : p.getIdeas()) {
            List<Long> ids = parseIds(idea.getRelatedMaterialIds());
            List<MaterialRef> refs = new ArrayList<>();
            for (Long id : ids) {
                String title = titlesById.get(id);
                if (title != null) {
                    refs.add(new MaterialRef(id, title));
                }
            }
            ideas.add(new IdeaInfo(idea.getId(), idea.getTitle(), idea.getDescription(),
                    ids, refs, idea.getOrderIndex()));
        }
        return new ProposalResponse(
                p.getId(), p.getTargetCompanyName(), p.getCompanyAnalysis(),
                p.getCreatedBy().getName(), p.getCreatedAt(), ideas);
    }
}
