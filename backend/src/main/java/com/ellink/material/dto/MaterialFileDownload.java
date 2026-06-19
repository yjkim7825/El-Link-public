package com.ellink.material.dto;

/**
 * 자료 첨부 파일 다운로드용 메타데이터(스트리밍 시 컨트롤러가 사용). 클라이언트에 직접 노출하지 않는다.
 */
public record MaterialFileDownload(
        String fileKey,
        String originalName,
        String mimeType,
        long size) {
}
