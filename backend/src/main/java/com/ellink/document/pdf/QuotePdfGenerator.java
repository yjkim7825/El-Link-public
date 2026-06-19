package com.ellink.document.pdf;

import com.ellink.common.exception.BusinessException;
import com.ellink.common.exception.ErrorCode;
import com.ellink.quote.entity.Quote;
import com.ellink.quote.entity.QuoteItem;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Quote 엔티티 → 견적서 PDF 바이트. 템플릿(templates/quote.html)의 @@TOKEN@@ 자리를
 * 단순 문자열 치환으로 채운다(Thymeleaf 미사용 — 의존성 최소화). 모든 동적 값은 HTML 이스케이프한다.
 *
 * 라인의 unitPrice/subtotal 은 발급 시점 스냅샷이므로, 카탈로그 단가가 이후 바뀌어도
 * 같은 Quote 로 재생성하면 동일한 PDF가 나온다.
 */
@Component
public class QuotePdfGenerator {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy.MM.dd");

    // EcoLink 공급자 고정 정보(견적서 헤더용)
    private static final String SUPPLIER_NAME = "EcoLink Inc.";
    private static final String SUPPLIER_CEO = "Jane Doe";
    private static final String SUPPLIER_BIZNO = "000-00-00000";
    private static final String SUPPLIER_ADDRESS = "123 Demo Street, Seoul, Republic of Korea";
    private static final String SUPPLIER_BIZTYPE = "서비스/교육서비스업";
    private static final String SUPPLIER_BIZITEM = "개인및가정용품수리업/환경창의교육";

    private final PdfRenderer pdfRenderer;
    private final String template;

    public QuotePdfGenerator(PdfRenderer pdfRenderer) {
        this.pdfRenderer = pdfRenderer;
        this.template = loadTemplate();
    }

    private String loadTemplate() {
        try {
            return new String(new ClassPathResource("templates/quote.html").getInputStream().readAllBytes(),
                    StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new IllegalStateException("견적서 템플릿 로드 실패: templates/quote.html", e);
        }
    }

    public byte[] generate(Quote quote) {
        NumberFormat nf = NumberFormat.getNumberInstance(Locale.KOREA);

        StringBuilder rows = new StringBuilder();
        for (QuoteItem item : quote.getItems()) {
            String unit = item.getCatalog() != null ? item.getCatalog().getUnit() : "";
            rows.append("<tr>")
                    .append("<td class=\"center\">").append(item.getOrderIndex() + 1).append("</td>")
                    .append("<td>").append(escape(item.getItemName())).append("</td>")
                    .append("<td class=\"center\">").append(escape(unit)).append("</td>")
                    .append("<td class=\"num\">").append(nf.format(item.getUnitPrice())).append("</td>")
                    .append("<td class=\"center\">").append(nf.format(item.getQuantity())).append("</td>")
                    .append("<td class=\"center\">").append(nf.format(item.getDays())).append("</td>")
                    .append("<td class=\"num\">").append(nf.format(item.getSubtotal())).append("</td>")
                    .append("</tr>");
        }
        if (quote.getItems().isEmpty()) {
            rows.append("<tr><td class=\"center\" colspan=\"7\">항목 없음</td></tr>");
        }

        Instant issuedAt = quote.getIssuedAt() != null ? quote.getIssuedAt() : Instant.EPOCH;
        String issuedDate = DATE_FMT.format(issuedAt.atZone(KST));
        String validUntil = DATE_FMT.format(issuedAt.atZone(KST).plusMonths(1));
        String clientCompany = quote.getClientCompanyName() != null
                ? quote.getClientCompanyName() : quote.getPartner().getCompanyName();

        String html = template
                .replace("@@CLIENT_COMPANY@@", escape(clientCompany))
                .replace("@@QUOTE_ID@@", String.valueOf(quote.getId()))
                .replace("@@ISSUED_DATE@@", issuedDate)
                .replace("@@VALID_UNTIL@@", validUntil)
                .replace("@@SUPPLIER_NAME@@", escape(SUPPLIER_NAME))
                .replace("@@SUPPLIER_CEO@@", escape(SUPPLIER_CEO))
                .replace("@@SUPPLIER_BIZNO@@", escape(SUPPLIER_BIZNO))
                .replace("@@SUPPLIER_ADDRESS@@", escape(SUPPLIER_ADDRESS))
                .replace("@@SUPPLIER_BIZTYPE@@", escape(SUPPLIER_BIZTYPE))
                .replace("@@SUPPLIER_BIZITEM@@", escape(SUPPLIER_BIZITEM))
                .replace("@@ITEM_ROWS@@", rows.toString())
                .replace("@@SUBTOTAL_SUM@@", nf.format(quote.getSubtotalSum()))
                .replace("@@COMPANY_PROFIT@@", nf.format(quote.getCompanyProfit()))
                .replace("@@SUPPLY_AMOUNT@@", nf.format(quote.getSupplyAmount()))
                .replace("@@VAT@@", nf.format(quote.getVat()))
                .replace("@@TOTAL_AMOUNT@@", nf.format(quote.getTotalAmount()));

        if (html.contains("@@")) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "견적서 템플릿 치환 누락(@@TOKEN@@ 잔존).");
        }
        return pdfRenderer.render(html);
    }

    /** XHTML 텍스트 노드용 최소 이스케이프. */
    private static String escape(String raw) {
        if (raw == null) {
            return "";
        }
        return raw.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
