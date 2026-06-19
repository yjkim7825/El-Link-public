package com.ellink.document.dto;

import com.ellink.document.CompanyDocType;
import com.ellink.document.entity.CompanyDocument;

import java.util.List;

/**
 * 파트너용 문서 목록(type별 그룹). 파트너에겐 fileKey/uploadedBy 등 내부 정보는 노출하지 않는다.
 */
public record PartnerDocumentGroup(
        CompanyDocType type,
        List<Item> documents) {

    public record Item(
            Long id,
            String title,
            String originalName,
            String mimeType,
            long size) {

        public static Item from(CompanyDocument d) {
            return new Item(d.getId(), d.getTitle(), d.getOriginalName(), d.getMimeType(), d.getSize());
        }
    }
}
