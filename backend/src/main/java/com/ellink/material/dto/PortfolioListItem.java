package com.ellink.material.dto;

import com.ellink.material.entity.Material;

import java.time.Instant;

/**
 * 파트너 포트폴리오 목록 항목(경량). 카드 노출용. 민감정보(fileKey/uploadedBy) 제외.
 * thumbnailUrl은 대표 이미지가 있을 때만 파트너 썸네일 엔드포인트 경로를 담는다.
 */
public record PortfolioListItem(
        Long id,
        String title,
        String summary,
        String category,
        String keywords,
        int fileCount,
        Instant createdAt,
        String thumbnailUrl) {

    public static PortfolioListItem from(Material m) {
        String thumbnailUrl = m.getThumbnailFileKey() != null
                ? "/api/partner/portfolio/" + m.getId() + "/thumbnail"
                : null;
        return new PortfolioListItem(
                m.getId(), m.getTitle(), m.getSummary(), m.getCategory(), m.getKeywords(),
                m.getFiles().size(), m.getCreatedAt(), thumbnailUrl);
    }
}
