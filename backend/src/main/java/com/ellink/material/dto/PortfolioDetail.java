package com.ellink.material.dto;

import com.ellink.material.entity.Material;
import com.ellink.material.entity.MaterialFile;

import java.time.Instant;
import java.util.List;

/**
 * 파트너 포트폴리오 상세(파트너용). 관리자 전용 정보(fileKey, uploadedByName)는 노출하지 않는다.
 */
public record PortfolioDetail(
        Long id,
        String title,
        String summary,
        String category,
        String keywords,
        Instant createdAt,
        String thumbnailUrl,
        List<FileInfo> files) {

    /** 첨부 파일 메타(fileKey 제외 — 다운로드는 파일 id로 수행). */
    public record FileInfo(
            Long id,
            String originalName,
            String mimeType,
            long size) {

        static FileInfo from(MaterialFile f) {
            return new FileInfo(f.getId(), f.getOriginalName(), f.getMimeType(), f.getSize());
        }
    }

    public static PortfolioDetail from(Material m) {
        String thumbnailUrl = m.getThumbnailFileKey() != null
                ? "/api/partner/portfolio/" + m.getId() + "/thumbnail"
                : null;
        return new PortfolioDetail(
                m.getId(), m.getTitle(), m.getSummary(), m.getCategory(), m.getKeywords(),
                m.getCreatedAt(), thumbnailUrl,
                m.getFiles().stream().map(FileInfo::from).toList());
    }
}
