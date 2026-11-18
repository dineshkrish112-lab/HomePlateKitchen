package com.homeplate.controller;

import com.homeplate.service.FileStorageService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/** Authenticated upload endpoint for photos, KYC documents and cooking videos. */
@RestController
@RequestMapping("/api/files")
public class FileController {
    private final FileStorageService storage;

    public FileController(FileStorageService storage) {
        this.storage = storage;
    }

    @PostMapping("/upload")
    public Map<String, Object> upload(@RequestParam("file") MultipartFile file,
                                      @RequestParam(defaultValue = "images") String folder) {
        String url = storage.store(file, folder);
        return Map.of("url", url, "name", String.valueOf(file.getOriginalFilename()), "size", file.getSize());
    }
}
