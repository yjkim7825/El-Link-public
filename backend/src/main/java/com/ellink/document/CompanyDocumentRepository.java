package com.ellink.document;

import com.ellink.document.entity.CompanyDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CompanyDocumentRepository extends JpaRepository<CompanyDocument, Long> {

    /** 관리자용 — 전체(비활성 포함), 종류·id 순. */
    List<CompanyDocument> findAllByOrderByTypeAscIdAsc();

    /** 파트너용 — 활성 문서만, 종류·id 순. */
    List<CompanyDocument> findByIsActiveTrueOrderByTypeAscIdAsc();
}
