package com.ellink.common.storage;

import com.ellink.common.exception.BusinessException;
import com.ellink.common.exception.ErrorCode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * 운영 프로필용 클라우드 저장소 — Supabase Storage REST API.
 * service_role 키를 Authorization: Bearer 로 사용하므로 private 버킷에 접근 가능하다.
 * (S3 호환 엔드포인트가 아니라 Supabase 전용 /storage/v1/object 엔드포인트를 호출)
 *
 * key = yyyy/MM/{uuid}{ext} (LocalStorageService와 동일 스킴). DB에는 key만 저장.
 */
@Service
@Profile("prod")
public class CloudStorageService implements StorageService {

    private static final Logger log = LoggerFactory.getLogger(CloudStorageService.class);
    private static final DateTimeFormatter DATE_PATH = DateTimeFormatter.ofPattern("yyyy/MM");

    private final String baseUrl;     // 예: https://xxxx.supabase.co
    private final String serviceKey;  // service_role 키 (백엔드 전용, 절대 클라 노출 X)
    private final String bucket;      // 예: ellink-files
    private final HttpClient http;

    public CloudStorageService(
            @Value("${ellink.storage.supabase.url}") String baseUrl,
            @Value("${ellink.storage.supabase.service-key}") String serviceKey,
            @Value("${ellink.storage.supabase.bucket}") String bucket) {
        this.baseUrl = stripTrailingSlash(baseUrl);
        this.serviceKey = serviceKey;
        this.bucket = bucket;
        this.http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
        if (baseUrl == null || baseUrl.isBlank() || serviceKey == null || serviceKey.isBlank()) {
            log.warn("[storage] Supabase 설정이 비어 있습니다. SUPABASE_URL / SUPABASE_SERVICE_KEY 환경변수를 확인하세요.");
        }
    }

    @Override
    public StoredObject store(String keyHint, byte[] content, String contentType) {
        String key = DATE_PATH.format(LocalDate.now()) + "/" + UUID.randomUUID() + extension(keyHint);
        String ct = (contentType == null || contentType.isBlank()) ? "application/octet-stream" : contentType;
        HttpRequest req = baseRequest(objectUri(key))
                .header("Content-Type", ct)
                .header("x-upsert", "true")
                .POST(HttpRequest.BodyPublishers.ofByteArray(content))
                .build();
        HttpResponse<String> res = send(req, HttpResponse.BodyHandlers.ofString());
        if (res.statusCode() / 100 != 2) {
            log.error("[storage] 업로드 실패 status={} body={}", res.statusCode(), res.body());
            throw new BusinessException(ErrorCode.STORAGE_ERROR);
        }
        return new StoredObject(key, content.length, ct);
    }

    @Override
    public Resource load(String key) {
        HttpRequest req = baseRequest(objectUri(key)).GET().build();
        HttpResponse<byte[]> res = send(req, HttpResponse.BodyHandlers.ofByteArray());
        if (res.statusCode() == 404 || res.statusCode() == 400) {
            throw new BusinessException(ErrorCode.FILE_NOT_FOUND);
        }
        if (res.statusCode() / 100 != 2) {
            log.error("[storage] 다운로드 실패 status={}", res.statusCode());
            throw new BusinessException(ErrorCode.STORAGE_ERROR);
        }
        return new ByteArrayResource(res.body());
    }

    @Override
    public void delete(String key) {
        HttpRequest req = baseRequest(objectUri(key)).DELETE().build();
        HttpResponse<String> res = send(req, HttpResponse.BodyHandlers.ofString());
        // 없는 객체 삭제는 무시(LocalStorage.delete 동작과 동일)
        if (res.statusCode() / 100 != 2 && res.statusCode() != 404 && res.statusCode() != 400) {
            log.warn("[storage] 삭제 응답 status={} body={}", res.statusCode(), res.body());
        }
    }

    @Override
    public boolean exists(String key) {
        // /object/info/{bucket}/{path} 는 메타데이터만 반환(바이트 미전송).
        URI infoUri = URI.create(baseUrl + "/storage/v1/object/info/" + bucket + "/" + key);
        HttpRequest req = baseRequest(infoUri).GET().build();
        HttpResponse<Void> res = send(req, HttpResponse.BodyHandlers.discarding());
        return res.statusCode() / 100 == 2;
    }

    // --- helpers ---

    private URI objectUri(String key) {
        return URI.create(baseUrl + "/storage/v1/object/" + bucket + "/" + key);
    }

    private HttpRequest.Builder baseRequest(URI uri) {
        return HttpRequest.newBuilder(uri)
                .timeout(Duration.ofSeconds(30))
                .header("Authorization", "Bearer " + serviceKey);
    }

    private <T> HttpResponse<T> send(HttpRequest req, HttpResponse.BodyHandler<T> handler) {
        try {
            return http.send(req, handler);
        } catch (Exception e) {
            log.error("[storage] Supabase 요청 실패: {}", e.getMessage());
            throw new BusinessException(ErrorCode.STORAGE_ERROR);
        }
    }

    private static String stripTrailingSlash(String s) {
        if (s == null) return "";
        return s.endsWith("/") ? s.substring(0, s.length() - 1) : s;
    }

    private static String extension(String keyHint) {
        if (keyHint == null) return "";
        int dot = keyHint.lastIndexOf('.');
        return (dot >= 0) ? keyHint.substring(dot) : "";
    }
}
