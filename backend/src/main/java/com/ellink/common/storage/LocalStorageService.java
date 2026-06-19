package com.ellink.common.storage;

import com.ellink.common.exception.BusinessException;
import com.ellink.common.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * 개발 프로필용 로컬 파일시스템 저장소. key = yyyy/MM/{uuid}{ext}, 실제 경로 = {baseDir}/{key}.
 */
@Service
@Profile("dev")
public class LocalStorageService implements StorageService {

    private static final DateTimeFormatter DATE_PATH = DateTimeFormatter.ofPattern("yyyy/MM");

    private final Path baseDir;

    public LocalStorageService(@Value("${ellink.storage.local.base-dir:./storage}") String baseDir) {
        this.baseDir = Paths.get(baseDir).toAbsolutePath().normalize();
    }

    @Override
    public StoredObject store(String keyHint, byte[] content, String contentType) {
        String key = DATE_PATH.format(LocalDate.now()) + "/" + UUID.randomUUID() + extension(keyHint);
        Path target = resolve(key);
        try {
            Files.createDirectories(target.getParent());
            Files.write(target, content);
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.STORAGE_ERROR);
        }
        return new StoredObject(key, content.length, contentType);
    }

    @Override
    public Resource load(String key) {
        Path target = resolve(key);
        if (!Files.exists(target)) {
            throw new BusinessException(ErrorCode.FILE_NOT_FOUND);
        }
        return new FileSystemResource(target);
    }

    @Override
    public void delete(String key) {
        try {
            Files.deleteIfExists(resolve(key));
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.STORAGE_ERROR);
        }
    }

    @Override
    public boolean exists(String key) {
        return Files.exists(resolve(key));
    }

    /** 경로 탈출(../) 방지: 항상 baseDir 하위로 강제. */
    private Path resolve(String key) {
        Path resolved = baseDir.resolve(key).normalize();
        if (!resolved.startsWith(baseDir)) {
            throw new BusinessException(ErrorCode.STORAGE_ERROR, "잘못된 파일 키입니다.");
        }
        return resolved;
    }

    private String extension(String keyHint) {
        if (keyHint == null) {
            return "";
        }
        int dot = keyHint.lastIndexOf('.');
        return (dot >= 0) ? keyHint.substring(dot) : "";
    }
}
