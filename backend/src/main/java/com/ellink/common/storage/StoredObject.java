package com.ellink.common.storage;

/**
 * 저장된 객체의 메타데이터. DB에는 이 정보(key/size/contentType)만 보관한다.
 */
public record StoredObject(String key, long size, String contentType) {
}
