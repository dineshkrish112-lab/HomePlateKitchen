package com.homeplate.service;

import com.homeplate.config.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

/**
 * Stores uploads on local disk under {upload-dir}/{folder}. Swap this class for an S3 / cloud
 * storage implementation later without touching controllers.
 */
@Service
public class FileStorageService {
    private static final Set<String> ALLOWED = Set.of(
            "jpg", "jpeg", "png", "webp", "gif", "pdf", "mp4", "webm", "mov", "m4v");
    private static final Set<String> FOLDERS = Set.of("images", "documents", "videos", "misc");

    private final Path root;

    public FileStorageService(@Value("${homeplate.upload-dir}") String uploadDir) {
        this.root = Path.of(uploadDir).toAbsolutePath().normalize();
    }

    public String store(MultipartFile file, String folder) {
        if (file == null || file.isEmpty()) throw ApiException.badRequest("Please choose a file");
        String safeFolder = FOLDERS.contains(folder) ? folder : "misc";
        String original = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
        int dot = original.lastIndexOf('.');
        String ext = dot >= 0 ? original.substring(dot + 1).toLowerCase() : "";
        if (!ALLOWED.contains(ext)) throw ApiException.badRequest("File type ." + ext + " is not allowed");
        String name = UUID.randomUUID().toString().replace("-", "") + "." + ext;
        try {
            Path dir = root.resolve(safeFolder);
            Files.createDirectories(dir);
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, dir.resolve(name), StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            throw ApiException.badRequest("Could not save file: " + e.getMessage());
        }
        return "/uploads/" + safeFolder + "/" + name;
    }
}
