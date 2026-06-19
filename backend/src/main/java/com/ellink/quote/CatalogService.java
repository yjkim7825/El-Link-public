package com.ellink.quote;

import com.ellink.common.exception.BusinessException;
import com.ellink.common.exception.ErrorCode;
import com.ellink.quote.dto.CatalogCreateRequest;
import com.ellink.quote.dto.CatalogResponse;
import com.ellink.quote.dto.CatalogUpdateRequest;
import com.ellink.quote.entity.PriceCatalog;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CatalogService {

    private final PriceCatalogRepository catalogRepository;

    public CatalogService(PriceCatalogRepository catalogRepository) {
        this.catalogRepository = catalogRepository;
    }

    /** 관리자 — 전체(비활성 포함). */
    @Transactional(readOnly = true)
    public List<CatalogResponse> listAll() {
        return catalogRepository.findAllByOrderByCategoryAscIdAsc().stream()
                .map(CatalogResponse::from)
                .toList();
    }

    /** 파트너 — 활성 품목만. */
    @Transactional(readOnly = true)
    public List<CatalogResponse> listActive() {
        return catalogRepository.findByIsActiveTrueOrderByCategoryAscIdAsc().stream()
                .map(CatalogResponse::from)
                .toList();
    }

    @Transactional
    public CatalogResponse create(CatalogCreateRequest req) {
        PriceCatalog catalog = catalogRepository.save(new PriceCatalog(
                req.category(), req.itemName(), req.unitPrice(), req.unit(), req.priceType()));
        return CatalogResponse.from(catalog);
    }

    @Transactional
    public CatalogResponse update(Long id, CatalogUpdateRequest req) {
        PriceCatalog catalog = findOrThrow(id);
        catalog.update(req.category(), req.itemName(), req.unitPrice(),
                req.unit(), req.priceType(), req.isActive());
        return CatalogResponse.from(catalog);
    }

    /** soft delete — isActive=false. 과거 견적 스냅샷에는 영향 없음. */
    @Transactional
    public void deactivate(Long id) {
        findOrThrow(id).deactivate();
    }

    private PriceCatalog findOrThrow(Long id) {
        return catalogRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.CATALOG_ITEM_NOT_FOUND));
    }
}
