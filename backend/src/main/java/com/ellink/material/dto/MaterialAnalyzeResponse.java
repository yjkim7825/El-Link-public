package com.ellink.material.dto;

/**
 * 분석 결과 + 저장된 원본 파일 메타데이터(파일 없이 텍스트만 분석한 경우 file=null).
 * 이 응답을 사용자가 검토/수정한 뒤 POST /api/admin/materials 로 확정 저장한다.
 */
public record MaterialAnalyzeResponse(
        MaterialAnalysis analysis,
        MaterialFileRef file,
        MaterialFileRef thumbnail) {
}
