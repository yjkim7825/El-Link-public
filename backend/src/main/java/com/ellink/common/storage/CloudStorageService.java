package com.ellink.common.storage;

import org.springframework.context.annotation.Profile;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

/**
 * 운영 프로필용 클라우드 저장소(Cloudflare R2 / Supabase Storage, S3 호환).
 * 현재는 인터페이스 자리만 잡아둔 스텁이며, 운영 단계에서 S3 SDK로 구현한다.
 */
@Service
@Profile("prod")
public class CloudStorageService implements StorageService {

    @Override
    public StoredObject store(String keyHint, byte[] content, String contentType) {
        throw new UnsupportedOperationException("CloudStorageService는 운영 단계에서 구현 예정입니다.");
    }

    @Override
    public Resource load(String key) {
        throw new UnsupportedOperationException("CloudStorageService는 운영 단계에서 구현 예정입니다.");
    }

    @Override
    public void delete(String key) {
        throw new UnsupportedOperationException("CloudStorageService는 운영 단계에서 구현 예정입니다.");
    }

    @Override
    public boolean exists(String key) {
        throw new UnsupportedOperationException("CloudStorageService는 운영 단계에서 구현 예정입니다.");
    }
}
