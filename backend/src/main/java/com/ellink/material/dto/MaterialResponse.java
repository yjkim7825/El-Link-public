package com.ellink.material.dto;

import com.ellink.material.entity.Material;
import com.ellink.material.entity.MaterialFile;

import java.time.Instant;
import java.util.List;

/**
 * 자료 단건 상세 응답.
 */
public record MaterialResponse(
        Long id,
        String title,
        String summary,
        String category,
        String keywords,
        String uploadedByName,
        Instant createdAt,
        String thumbnailUrl,
        List<FileInfo> files) {

    public record FileInfo(
            Long id,
            String fileKey,
            String originalName,
            String mimeType,
            long size,
            Instant uploadedAt) {

        static FileInfo from(MaterialFile f) {
            return new FileInfo(f.getId(), f.getFileKey(), f.getOriginalName(),
                    f.getMimeType(), f.getSize(), f.getUploadedAt());
        }
    }

    public static MaterialResponse from(Material m) {
        String thumbnailUrl = m.getThumbnailFileKey() != null
                ? "/api/admin/materials/" + m.getId() + "/thumbnail"
                : null;
        return new MaterialResponse(
                m.getId(), m.getTitle(), m.getSummary(), m.getCategory(), m.getKeywords(),
                m.getUploadedBy().getName(), m.getCreatedAt(), thumbnailUrl,
                m.getFiles().stream().map(FileInfo::from).toList());
    }
}
