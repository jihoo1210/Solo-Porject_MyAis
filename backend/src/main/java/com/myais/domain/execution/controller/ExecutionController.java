package com.myais.domain.execution.controller;

import com.myais.domain.execution.dto.ExecutionDto;
import com.myais.domain.execution.service.ExecutionService;
import com.myais.global.common.ApiResponse;
import com.myais.global.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ExecutionController {

    private final ExecutionService executionService;

    @PostMapping("/ai-tools/{id}/execute")
    public ApiResponse<ExecutionDto.ExecuteResponse> execute(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable("id") UUID id,
            @RequestBody ExecutionDto.ExecuteRequest request) {
        return ApiResponse.success(executionService.execute(userDetails.getUserId(), id, request));
    }

    @PostMapping(value = "/ai-tools/{id}/execute/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter executeStream(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable("id") UUID id,
            @RequestBody ExecutionDto.ExecuteRequest request) {
        return executionService.executeStream(userDetails.getUserId(), id, request);
    }

    @GetMapping("/history")
    public ApiResponse<ExecutionDto.PageResponse> getHistory(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(name = "aiToolId", required = false) UUID aiToolId,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        return ApiResponse.success(executionService.getHistory(userDetails.getUserId(), aiToolId, page, size));
    }

    @GetMapping("/history/{id}")
    public ApiResponse<ExecutionDto.Response> getExecutionById(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable("id") UUID id) {
        return ApiResponse.success(executionService.getExecutionById(userDetails.getUserId(), id));
    }

    @DeleteMapping("/history/{id}")
    public ApiResponse<Void> deleteExecution(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable("id") UUID id) {
        executionService.deleteExecution(userDetails.getUserId(), id);
        return ApiResponse.success(null, "히스토리가 삭제되었습니다.");
    }

    @PostMapping("/history/{id}/favorite")
    public ApiResponse<Map<String, Boolean>> toggleFavorite(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable("id") UUID id) {
        boolean isFavorite = executionService.toggleFavorite(userDetails.getUserId(), id);
        return ApiResponse.success(Map.of("isFavorite", isFavorite));
    }

    @GetMapping("/history/recent")
    public ApiResponse<List<ExecutionDto.Response>> getRecentExecutions(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(executionService.getRecentExecutions(userDetails.getUserId()));
    }
}
