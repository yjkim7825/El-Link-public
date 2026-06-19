package com.ellink.document.dto;

/**
 * 다운로드용 메타데이터(서비스 → 컨트롤러). 발급 이력 기록 후 컨트롤러가 이 키로 스트리밍한다.
 */
public record DownloadMeta(
        String fileKey,
        String originalName,
        String mimeType,
        long size) {
}
