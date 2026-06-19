package com.ellink.material.dto;

import com.ellink.material.entity.Material;

import java.time.Instant;

/**
 * 자료 목록 항목(경량). 파일은 개수만 노출한다.
 */
public record MaterialListItem(
        Long id,
        String title,
        String summary,
        String category,
        String keywords,
        int fileCount,
        Instant createdAt) {

    public static MaterialListItem from(Material m) {
        return new MaterialListItem(
                m.getId(), m.getTitle(), m.getSummary(), m.getCategory(), m.getKeywords(),
                m.getFiles().size(), m.getCreatedAt());
    }
}
