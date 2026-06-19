package com.ellink.quote;

import com.ellink.common.exception.BusinessException;
import com.ellink.common.exception.ErrorCode;
import com.ellink.common.storage.StorageService;
import com.ellink.common.storage.StoredObject;
import com.ellink.document.pdf.QuotePdfGenerator;
import com.ellink.partner.PartnerRepository;
import com.ellink.partner.entity.Partner;
import com.ellink.quote.dto.QuoteCreateRequest;
import com.ellink.quote.dto.QuoteItemRequest;
import com.ellink.quote.dto.QuoteListItem;
import com.ellink.quote.dto.QuoteResponse;
import com.ellink.quote.entity.PriceCatalog;
import com.ellink.quote.entity.Quote;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.time.Instant;
import java.util.List;

@Service
public class QuoteService {

    private final QuoteRepository quoteRepository;
    private final PriceCatalogRepository catalogRepository;
    private final PartnerRepository partnerRepository;
    private final QuotePdfGenerator quotePdfGenerator;
    private final StorageService storageService;

    public QuoteService(QuoteRepository quoteRepository,
                        PriceCatalogRepository catalogRepository,
                        PartnerRepository partnerRepository,
                        QuotePdfGenerator quotePdfGenerator,
                        StorageService storageService) {
        this.quoteRepository = quoteRepository;
        this.catalogRepository = catalogRepository;
        this.partnerRepository = partnerRepository;
        this.quotePdfGenerator = quotePdfGenerator;
        this.storageService = storageService;
    }

    /**
     * 견적 생성(DRAFT). 라인별로 단가를 스냅샷하고 totalAmount는 서버가 재계산한다.
     * - 카탈로그 라인: FIXED는 카탈로그 단가 복사, CUSTOM은 입력 단가 사용. 비활성 카탈로그는 400.
     * - 커스텀 라인(catalogId 없음): itemName/unitPrice 필수.
     */
    @Transactional
    public QuoteResponse create(Long partnerId, QuoteCreateRequest req) {
        Partner partner = partnerRepository.findById(partnerId)
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));

        Quote quote = new Quote(partner);
        if (StringUtils.hasText(req.clientCompanyName())) {
            quote.setClientCompanyName(req.clientCompanyName().trim());
        }
        for (QuoteItemRequest line : req.items()) {
            if (line.catalogId() != null) {
                addCatalogLine(quote, line);
            } else {
                addCustomLine(quote, line);
            }
        }
        quote.recalculateTotal();
        return QuoteResponse.from(quoteRepository.save(quote));
    }

    /** 일수 — null이면 1, 1 미만이면 400. */
    private int resolveDays(QuoteItemRequest line) {
        int days = line.days() == null ? 1 : line.days();
        if (days < 1) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "일수는 1 이상이어야 합니다.");
        }
        return days;
    }

    private void addCatalogLine(Quote quote, QuoteItemRequest line) {
        PriceCatalog catalog = catalogRepository.findById(line.catalogId())
                .orElseThrow(() -> new BusinessException(ErrorCode.CATALOG_ITEM_NOT_FOUND));
        if (!catalog.isActive()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR,
                    "비활성 카탈로그 항목은 견적에 사용할 수 없습니다: " + catalog.getItemName());
        }
        long unitPrice = switch (catalog.getPriceType()) {
            case FIXED -> catalog.getUnitPrice();
            case CUSTOM -> {
                if (line.unitPrice() == null) {
                    throw new BusinessException(ErrorCode.VALIDATION_ERROR,
                            "입력형(CUSTOM) 항목은 단가를 입력해야 합니다: " + catalog.getItemName());
                }
                yield line.unitPrice();
            }
        };
        // itemName은 발급 시점 카탈로그 명칭으로 스냅샷
        quote.addItem(catalog, catalog.getItemName(), unitPrice, line.quantity(), resolveDays(line));
    }

    private void addCustomLine(Quote quote, QuoteItemRequest line) {
        if (!StringUtils.hasText(line.itemName())) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "커스텀 항목은 itemName이 필요합니다.");
        }
        if (line.unitPrice() == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "커스텀 항목은 단가가 필요합니다.");
        }
        quote.addItem(null, line.itemName().trim(), line.unitPrice(), line.quantity(), resolveDays(line));
    }

    @Transactional(readOnly = true)
    public List<QuoteListItem> list(Long partnerId) {
        return quoteRepository.findByPartnerIdOrderByCreatedAtDesc(partnerId).stream()
                .map(QuoteListItem::from)
                .toList();
    }

    /** 소유권 포함 조회 — 다른 파트너 견적이면 404(존재 노출 안 함). */
    @Transactional(readOnly = true)
    public QuoteResponse get(Long partnerId, Long quoteId) {
        Quote quote = quoteRepository.findByIdAndPartnerId(quoteId, partnerId)
                .orElseThrow(() -> new BusinessException(ErrorCode.QUOTE_NOT_FOUND));
        return QuoteResponse.from(quote);
    }

    /**
     * 견적 발급 — DRAFT 만 가능. PDF를 생성해 StorageService에 저장하고 상태를 ISSUED로 전환한다.
     * 라인 단가는 이미 스냅샷이므로, 발급 시점의 금액으로 PDF가 고정된다. 생성한 PDF 바이트를 반환한다.
     */
    @Transactional
    public byte[] issue(Long partnerId, Long quoteId) {
        Quote quote = quoteRepository.findByIdAndPartnerId(quoteId, partnerId)
                .orElseThrow(() -> new BusinessException(ErrorCode.QUOTE_NOT_FOUND));
        if (quote.isIssued()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "이미 발급된 견적입니다.");
        }
        if (!StringUtils.hasText(quote.getClientCompanyName())) {
            throw new BusinessException(ErrorCode.CLIENT_COMPANY_REQUIRED);
        }
        quote.markIssued(Instant.now(), null);
        byte[] pdf = quotePdfGenerator.generate(quote);
        StoredObject stored = storageService.store(
                "quote-" + quote.getId() + ".pdf", pdf, "application/pdf");
        quote.markIssued(quote.getIssuedAt(), stored.key());
        return pdf;
    }

    /**
     * 발급된 견적서 PDF 바이트 조회 — 다른 파트너 견적이거나 아직 발급되지 않았으면 404(존재 노출 안 함).
     */
    @Transactional(readOnly = true)
    public byte[] getPdf(Long partnerId, Long quoteId) {
        Quote quote = quoteRepository.findByIdAndPartnerId(quoteId, partnerId)
                .orElseThrow(() -> new BusinessException(ErrorCode.QUOTE_NOT_FOUND));
        if (!quote.isIssued() || quote.getPdfFileKey() == null) {
            throw new BusinessException(ErrorCode.QUOTE_NOT_FOUND);
        }
        try {
            return storageService.load(quote.getPdfFileKey()).getInputStream().readAllBytes();
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.STORAGE_ERROR, "견적서 PDF를 읽을 수 없습니다.");
        }
    }
}
