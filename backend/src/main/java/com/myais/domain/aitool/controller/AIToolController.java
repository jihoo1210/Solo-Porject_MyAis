package com.myais.domain.aitool.controller;

import com.myais.domain.aitool.dto.AIToolDto;
import com.myais.domain.aitool.service.AIToolService;
import com.myais.global.common.ApiResponse;
import com.myais.global.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ai-tools")
@RequiredArgsConstructor
public class AIToolController {

    private final AIToolService aiToolService;

    @GetMapping
    public ApiResponse<List<AIToolDto.Response>> getAllTools(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(aiToolService.getAllTools(userDetails.getUserId()));
    }

    @GetMapping("/{id}")
    public ApiResponse<AIToolDto.Response> getToolById(@PathVariable UUID id) {
        return ApiResponse.success(aiToolService.getToolById(id));
    }

    @GetMapping("/search")
    public ApiResponse<List<AIToolDto.Response>> searchTools(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam String keyword) {
        return ApiResponse.success(aiToolService.searchTools(userDetails.getUserId(), keyword));
    }

    @GetMapping("/category/{category}")
    public ApiResponse<List<AIToolDto.Response>> getToolsByCategory(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String category) {
        return ApiResponse.success(aiToolService.getToolsByCategory(userDetails.getUserId(), category));
    }

    @GetMapping("/favorites")
    public ApiResponse<List<AIToolDto.Response>> getFavorites(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(aiToolService.getFavorites(userDetails.getUserId()));
    }

    @PostMapping
    public ApiResponse<AIToolDto.Response> createTool(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody AIToolDto.CreateRequest request) {
        return ApiResponse.success(aiToolService.createTool(userDetails.getUserId(), request));
    }

    @PutMapping("/{id}")
    public ApiResponse<AIToolDto.Response> updateTool(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id,
            @Valid @RequestBody AIToolDto.UpdateRequest request) {
        return ApiResponse.success(aiToolService.updateTool(userDetails.getUserId(), id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteTool(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        aiToolService.deleteTool(userDetails.getUserId(), id);
        return ApiResponse.success(null, "AI 도구가 삭제되었습니다.");
    }

    @PostMapping("/{id}/favorite")
    public ApiResponse<Map<String, Boolean>> toggleFavorite(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable UUID id) {
        boolean isFavorite = aiToolService.toggleFavorite(userDetails.getUserId(), id);
        return ApiResponse.success(Map.of("isFavorite", isFavorite));
    }
}
