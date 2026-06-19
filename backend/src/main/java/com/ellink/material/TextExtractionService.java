package com.ellink.material;

import com.ellink.common.exception.BusinessException;
import com.ellink.common.exception.ErrorCode;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;

/**
 * 업로드 파일에서 분석용 텍스트를 추출한다.
 * PDF → pdfbox(PDFTextStripper), docx → Apache POI, text/* → UTF-8 디코드.
 * 이미지 등 추출 불가 타입은 빈 문자열을 반환하고, 호출부가 inline_data로 Gemini에 직접 전달한다.
 */
@Service
public class TextExtractionService {

    private static final Logger log = LoggerFactory.getLogger(TextExtractionService.class);

    private static final String MIME_PDF = "application/pdf";
    private static final String MIME_DOCX =
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    public boolean isImage(String mimeType) {
        return mimeType != null && mimeType.startsWith("image/");
    }

    /** 추출 가능한 타입이면 텍스트, 아니면 빈 문자열. */
    public String extract(byte[] content, String mimeType, String filename) {
        String type = normalize(mimeType, filename);
        try {
            if (MIME_PDF.equals(type)) {
                return extractPdf(content);
            }
            if (MIME_DOCX.equals(type)) {
                return extractDocx(content);
            }
            if (type != null && type.startsWith("text/")) {
                return new String(content, StandardCharsets.UTF_8);
            }
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("텍스트 추출 실패 (type={}, file={})", type, filename, e);
            throw new BusinessException(ErrorCode.STORAGE_ERROR, "파일에서 텍스트를 추출하지 못했습니다.");
        }
        return "";
    }

    private String extractPdf(byte[] content) throws Exception {
        try (PDDocument document = PDDocument.load(content)) {
            return new PDFTextStripper().getText(document).trim();
        }
    }

    private String extractDocx(byte[] content) throws Exception {
        try (XWPFDocument document = new XWPFDocument(new ByteArrayInputStream(content));
             XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
            return extractor.getText().trim();
        }
    }

    /** content-type이 비어있거나 octet-stream이면 확장자로 보정. */
    private String normalize(String mimeType, String filename) {
        if (mimeType != null && !mimeType.isBlank()
                && !"application/octet-stream".equalsIgnoreCase(mimeType)) {
            return mimeType.toLowerCase();
        }
        if (filename == null) {
            return mimeType;
        }
        String lower = filename.toLowerCase();
        if (lower.endsWith(".pdf")) {
            return MIME_PDF;
        }
        if (lower.endsWith(".docx")) {
            return MIME_DOCX;
        }
        if (lower.endsWith(".txt")) {
            return "text/plain";
        }
        return mimeType;
    }
}
