package com.ellink.quote;

import com.ellink.common.response.ApiResponse;
import com.ellink.common.security.AuthPrincipal;
import com.ellink.quote.dto.QuoteCreateRequest;
import com.ellink.quote.dto.QuoteListItem;
import com.ellink.quote.dto.QuoteResponse;
import jakarta.validation.Valid;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 파트너용 견적 API. 본인 견적만 생성/조회 가능. /api/partner/** 가드 적용.
 */
@RestController
@RequestMapping("/api/partner/quotes")
public class PartnerQuoteController {

    private final QuoteService quoteService;

    public PartnerQuoteController(QuoteService quoteService) {
        this.quoteService = quoteService;
    }

    @PostMapping
    public ApiResponse<QuoteResponse> create(@AuthenticationPrincipal AuthPrincipal principal,
                                             @Valid @RequestBody QuoteCreateRequest req) {
        return ApiResponse.ok(quoteService.create(principal.id(), req));
    }

    @GetMapping
    public ApiResponse<List<QuoteListItem>> list(@AuthenticationPrincipal AuthPrincipal principal) {
        return ApiResponse.ok(quoteService.list(principal.id()));
    }

    @GetMapping("/{id}")
    public ApiResponse<QuoteResponse> get(@AuthenticationPrincipal AuthPrincipal principal,
                                          @PathVariable Long id) {
        return ApiResponse.ok(quoteService.get(principal.id(), id));
    }

    /** 발급 — DRAFT → ISSUED + PDF 생성/저장. 응답으로 생성된 PDF를 그대로 내려준다. */
    @PostMapping("/{id}/issue")
    public ResponseEntity<byte[]> issue(@AuthenticationPrincipal AuthPrincipal principal,
                                        @PathVariable Long id) {
        return pdfResponse(quoteService.issue(principal.id(), id), id);
    }

    /** 발급된 견적서 PDF 다운로드. 본인 견적이 아니거나 DRAFT면 404. */
    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> pdf(@AuthenticationPrincipal AuthPrincipal principal,
                                      @PathVariable Long id) {
        return pdfResponse(quoteService.getPdf(principal.id(), id), id);
    }

    private ResponseEntity<byte[]> pdfResponse(byte[] pdf, Long id) {
        ContentDisposition disposition = ContentDisposition.attachment()
                .filename("quote-" + id + ".pdf")
                .build();
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .contentLength(pdf.length)
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(pdf);
    }
}
