package com.ellink.quote;

import com.ellink.quote.entity.PriceCatalog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PriceCatalogRepository extends JpaRepository<PriceCatalog, Long> {

    /** 관리자용 — 전체(분류·id 순). */
    List<PriceCatalog> findAllByOrderByCategoryAscIdAsc();

    /** 파트너용 — 활성 품목만. */
    List<PriceCatalog> findByIsActiveTrueOrderByCategoryAscIdAsc();

    long countByItemName(String itemName);
}
