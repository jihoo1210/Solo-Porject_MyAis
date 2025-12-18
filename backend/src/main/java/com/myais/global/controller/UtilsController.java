package com.myais.global.controller;

import com.myais.global.common.ApiResponse;
import com.myais.infra.crawler.CrawlerService;
import com.myais.infra.s3.S3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/utils")
@RequiredArgsConstructor
public class UtilsController {

    private final CrawlerService crawlerService;
    private final S3Service s3Service;

    @PostMapping("/crawl")
    public ApiResponse<Map<String, String>> crawlUrl(@RequestBody Map<String, String> request) {
        String url = request.get("url");
        String content = crawlerService.crawl(url);
        return ApiResponse.success(Map.of("content", content));
    }

    @PostMapping("/upload")
    public ApiResponse<Map<String, String>> uploadImage(@RequestPart("file") MultipartFile file) {
        String imageUrl = s3Service.uploadImage(file);
        return ApiResponse.success(Map.of("url", imageUrl));
    }

    @DeleteMapping("/image")
    public ApiResponse<Void> deleteImage(@RequestBody Map<String, String> request) {
        String imageUrl = request.get("url");
        if (imageUrl != null && !imageUrl.isEmpty()) {
            s3Service.deleteFile(imageUrl);
        }
        return ApiResponse.success(null);
    }
}
