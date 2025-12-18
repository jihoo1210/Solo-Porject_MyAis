package com.myais.domain.execution.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.myais.domain.aitool.dto.AIToolDto;
import com.myais.domain.aitool.entity.AITool;
import com.myais.domain.aitool.repository.AIToolRepository;
import com.myais.domain.execution.dto.ExecutionDto;
import com.myais.domain.execution.entity.Execution;
import com.myais.domain.execution.repository.ExecutionRepository;
import com.myais.domain.user.entity.User;
import com.myais.domain.user.repository.UserRepository;
import com.myais.global.exception.CustomException;
import com.myais.global.exception.ErrorCode;
import com.myais.infra.crawler.CrawlerService;
import com.myais.infra.openai.OpenAIClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExecutionService {

    private final ExecutionRepository executionRepository;
    private final AIToolRepository aiToolRepository;
    private final UserRepository userRepository;
    private final OpenAIClient openAIClient;
    private final CrawlerService crawlerService;
    private final ObjectMapper objectMapper;

    @Transactional
    public ExecutionDto.ExecuteResponse execute(UUID userId, UUID toolId, ExecutionDto.ExecuteRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        AITool aiTool = aiToolRepository.findById(toolId)
                .orElseThrow(() -> new CustomException(ErrorCode.AI_TOOL_NOT_FOUND));

        // Build user message from inputs
        String userMessage = buildUserMessage(aiTool, request.getInputs());

        // Call OpenAI API
        String result = openAIClient.chat(
                aiTool.getSystemPrompt(),
                userMessage,
                "gpt-4o-mini",
                0.7,
                2048
        );

        // Increment usage count
        aiTool.incrementUsageCount();

        // Save execution history
        try {
            Execution execution = Execution.builder()
                    .user(user)
                    .aiTool(aiTool)
                    .inputData(objectMapper.writeValueAsString(request.getInputs()))
                    .output(result)
                    .build();

            executionRepository.save(execution);

            return ExecutionDto.ExecuteResponse.builder()
                    .id(execution.getId())
                    .result(result)
                    .usage(ExecutionDto.Usage.builder()
                            .promptTokens(0)
                            .completionTokens(0)
                            .build())
                    .createdAt(execution.getCreatedAt())
                    .build();
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize execution data", e);
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    @Transactional
    public SseEmitter executeStream(UUID userId, UUID toolId, ExecutionDto.ExecuteRequest request) {
        userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        AITool aiTool = aiToolRepository.findById(toolId)
                .orElseThrow(() -> new CustomException(ErrorCode.AI_TOOL_NOT_FOUND));

        String userMessage = buildUserMessage(aiTool, request.getInputs());

        SseEmitter emitter = new SseEmitter(300000L); // 5 minutes timeout

        // Execute in separate thread
        new Thread(() -> {
            openAIClient.chatStream(
                    aiTool.getSystemPrompt(),
                    userMessage,
                    "gpt-4o-mini",
                    0.7,
                    2048,
                    emitter
            );
        }).start();

        return emitter;
    }

    private String buildUserMessage(AITool aiTool, Map<String, Object> inputs) {
        StringBuilder message = new StringBuilder();

        try {
            if (aiTool.getInputFields() != null) {
                List<AIToolDto.InputField> fields = objectMapper.readValue(
                        aiTool.getInputFields(),
                        new TypeReference<List<AIToolDto.InputField>>() {}
                );

                for (AIToolDto.InputField field : fields) {
                    Object value = inputs.get(field.getName());
                    if (value == null) continue;

                    switch (field.getType()) {
                        case "url" -> {
                            // Crawl URL and add content
                            String content = crawlerService.crawl(value.toString());
                            message.append("## ").append(field.getLabel()).append(" (크롤링된 내용)\n");
                            message.append(content).append("\n\n");
                        }
                        case "image" -> {
                            // Image URL will be handled separately for vision API
                            message.append("## ").append(field.getLabel()).append("\n");
                            message.append("[이미지: ").append(value).append("]\n\n");
                        }
                        default -> {
                            message.append("## ").append(field.getLabel()).append("\n");
                            if (value instanceof List) {
                                message.append(String.join(", ", ((List<?>) value).stream()
                                        .map(Object::toString)
                                        .collect(Collectors.toList())));
                            } else {
                                message.append(value.toString());
                            }
                            message.append("\n\n");
                        }
                    }
                }
            }
        } catch (JsonProcessingException e) {
            log.error("Failed to parse input fields", e);
            // Fallback: just append all inputs
            inputs.forEach((key, value) -> {
                message.append("## ").append(key).append("\n");
                message.append(value.toString()).append("\n\n");
            });
        }

        return message.toString();
    }

    public ExecutionDto.PageResponse getHistory(UUID userId, UUID aiToolId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Execution> executions;

        if (aiToolId != null) {
            executions = executionRepository.findByUserIdAndAiToolIdOrderByCreatedAtDesc(
                    userId, aiToolId, pageable);
        } else {
            executions = executionRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        }

        List<ExecutionDto.Response> content = executions.getContent().stream()
                .map(ExecutionDto.Response::from)
                .collect(Collectors.toList());

        return ExecutionDto.PageResponse.builder()
                .content(content)
                .totalElements(executions.getTotalElements())
                .totalPages(executions.getTotalPages())
                .page(page)
                .size(size)
                .build();
    }

    public ExecutionDto.Response getExecutionById(UUID userId, UUID executionId) {
        Execution execution = executionRepository.findById(executionId)
                .orElseThrow(() -> new CustomException(ErrorCode.EXECUTION_NOT_FOUND));

        if (!execution.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }

        return ExecutionDto.Response.from(execution);
    }

    @Transactional
    public void deleteExecution(UUID userId, UUID executionId) {
        Execution execution = executionRepository.findById(executionId)
                .orElseThrow(() -> new CustomException(ErrorCode.EXECUTION_NOT_FOUND));

        if (!execution.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }

        executionRepository.delete(execution);
    }

    @Transactional
    public boolean toggleFavorite(UUID userId, UUID executionId) {
        Execution execution = executionRepository.findById(executionId)
                .orElseThrow(() -> new CustomException(ErrorCode.EXECUTION_NOT_FOUND));

        if (!execution.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }

        execution.setIsFavorite(!execution.getIsFavorite());
        return execution.getIsFavorite();
    }

    public List<ExecutionDto.Response> getRecentExecutions(UUID userId) {
        List<Execution> executions = executionRepository.findTop5ByUserIdOrderByCreatedAtDesc(userId);
        return executions.stream()
                .map(ExecutionDto.Response::from)
                .collect(Collectors.toList());
    }
}
