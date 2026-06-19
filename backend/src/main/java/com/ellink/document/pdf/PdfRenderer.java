package com.ellink.document.pdf;

import com.ellink.common.exception.BusinessException;
import com.ellink.common.exception.ErrorCode;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

/**
 * HTML(XHTML) → PDF 변환 공통 유틸. 한글 폰트(Noto Sans KR)를 임베드한다.
 * 폰트 바이트는 기동 시 1회 로드해 재사용한다.
 */
@Component
public class PdfRenderer {

    /** 템플릿 CSS의 font-family 와 일치해야 한다. */
    public static final String FONT_FAMILY = "Noto Sans KR";
    private static final String FONT_CLASSPATH = "fonts/NotoSansKR-Regular.ttf";

    private final byte[] fontBytes;

    public PdfRenderer() {
        try {
            this.fontBytes = new ClassPathResource(FONT_CLASSPATH).getInputStream().readAllBytes();
        } catch (IOException e) {
            throw new IllegalStateException("PDF 한글 폰트 로드 실패: " + FONT_CLASSPATH, e);
        }
    }

    /**
     * well-formed XHTML 문자열을 PDF 바이트로 렌더링한다.
     * 입력 HTML은 자기닫음 태그 등 XML 규격을 지켜야 한다(openhtmltopdf 요구사항).
     */
    public byte[] render(String html) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.useFont(() -> new ByteArrayInputStream(fontBytes), FONT_FAMILY);
            builder.withHtmlContent(html, null);
            builder.toStream(out);
            builder.run();
            return out.toByteArray();
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "PDF 렌더링에 실패했습니다: " + e.getMessage());
        }
    }
}
