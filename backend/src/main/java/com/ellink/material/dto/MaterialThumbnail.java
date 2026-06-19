package com.ellink.material.dto;

/**
 * 대표 이미지 스트리밍용 메타(서비스 → 컨트롤러). mimeType은 key 확장자로 추론한다.
 */
public record MaterialThumbnail(String fileKey, String mimeType) {
}
