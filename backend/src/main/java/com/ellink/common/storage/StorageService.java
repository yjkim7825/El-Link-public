package com.ellink.common.storage;

import org.springframework.core.io.Resource;

/**
 * 파일 저장 추상화. 실제 바이트는 구현체(local/cloud)가 보관하고,
 * 애플리케이션/DB는 key와 메타데이터만 다룬다.
 */
public interface StorageService {

    /**
     * 바이트를 저장하고 메타데이터를 반환한다.
     *
     * @param keyHint     키 생성에 참고할 원본 파일명 등 (구현체가 안전한 key를 생성)
     * @param content     파일 바이트
     * @param contentType MIME 타입
     */
    StoredObject store(String keyHint, byte[] content, String contentType);

    /** key로 저장된 객체를 읽기 위한 Resource를 반환한다. */
    Resource load(String key);

    /** 객체 삭제. 없으면 무시. */
    void delete(String key);

    /** 존재 여부. */
    boolean exists(String key);
}
