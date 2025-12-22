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
import com.myais.infra.gemini.AIModel;
import com.myais.infra.gemini.GeminiClient;
import com.myais.infra.s3.S3Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.ByteArrayInputStream;
import java.time.LocalDate;
import java.util.Base64;
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
    private final GeminiClient geminiClient;
    private final CrawlerService crawlerService;
    private final S3Service s3Service;
    private final ObjectMapper objectMapper;

    @Transactional
    public ExecutionDto.ExecuteResponse execute(UUID userId, UUID toolId, ExecutionDto.ExecuteRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        // 이메일 인증 체크
        if (user.requiresEmailVerification()) {
            throw new CustomException(ErrorCode.EMAIL_NOT_VERIFIED);
        }

        // 일일 사용량 초기화 체크 (날짜가 바뀌었으면 초기화)
        checkAndResetDailyUsage(user);

        // FREE 사용자 일일 제한 체크
        if (user.hasReachedDailyLimit()) {
            throw new CustomException(ErrorCode.EXECUTION_LIMIT_EXCEEDED);
        }

        AITool aiTool = aiToolRepository.findById(toolId)
                .orElseThrow(() -> new CustomException(ErrorCode.AI_TOOL_NOT_FOUND));

        // Pro 모델 사용 시 구독 검증
        String modelId = aiTool.getAiModel() != null ? aiTool.getAiModel() : "gemini-2.5-flash-lite";
        if (AIModel.isProModel(modelId) && !user.isPro()) {
            throw new CustomException(ErrorCode.PRO_SUBSCRIPTION_REQUIRED);
        }

        // Build user message from inputs
        String userMessage = buildUserMessage(aiTool, request.getInputs());

        // 실행 시간 측정 시작
        long startTime = System.currentTimeMillis();

        // 이미지 생성 모델인지 확인
        boolean isImageModel = AIModel.isImageGenerationModel(modelId);

        String resultText;
        String imageUrl = null;
        Integer totalTokens = null;

        if (isImageModel) {
            // 이미지 생성 모델 처리
            GeminiClient.ImageGenerationResponse imageResponse = geminiClient.generateImage(
                    aiTool.getSystemPrompt(),
                    userMessage,
                    modelId
            );

            totalTokens = imageResponse.getTotalTokens();

            // 이미지가 생성된 경우 S3에 저장
            if (imageResponse.getImageBase64() != null) {
                imageUrl = saveBase64ImageToS3(imageResponse.getImageBase64(), imageResponse.getMimeType());
                // 결과에 이미지 URL과 텍스트 포함
                resultText = imageResponse.getText() != null
                        ? imageResponse.getText() + "\n\n![생성된 이미지](" + imageUrl + ")"
                        : "![생성된 이미지](" + imageUrl + ")";
            } else {
                resultText = imageResponse.getText() != null
                        ? imageResponse.getText()
                        : "이미지 생성에 실패했습니다.";
            }
        } else {
            // 일반 텍스트 모델 처리
            int maxLength = getMaxLengthFromOutputConfig(aiTool);
            String enhancedSystemPrompt = buildEnhancedSystemPrompt(aiTool.getSystemPrompt(), maxLength);
            int maxTokens = Math.max(512, (int) (maxLength * 0.7));

            GeminiClient.ChatResponse chatResponse = geminiClient.chat(
                    enhancedSystemPrompt,
                    userMessage,
                    modelId,
                    0.7,
                    maxTokens
            );

            resultText = chatResponse.getText();
            totalTokens = chatResponse.getTotalTokens();
        }

        // 실행 시간 측정 종료
        long executionTime = System.currentTimeMillis() - startTime;

        // Increment usage count
        aiTool.incrementUsageCount();

        // Increment user's daily usage count
        user.incrementDailyUsage();
        userRepository.save(user);

        // Save execution history
        try {
            Execution execution = Execution.builder()
                    .user(user)
                    .aiTool(aiTool)
                    .inputData(objectMapper.writeValueAsString(request.getInputs()))
                    .output(resultText)
                    .imageUrl(imageUrl)
                    .executionTime(executionTime)
                    .tokensUsed(totalTokens)
                    .build();

            executionRepository.save(execution);

            return ExecutionDto.ExecuteResponse.builder()
                    .id(execution.getId())
                    .result(resultText)
                    .imageUrl(imageUrl)
                    .usage(ExecutionDto.Usage.builder()
                            .promptTokens(0)
                            .completionTokens(totalTokens != null ? totalTokens : 0)
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
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        // 이메일 인증 체크
        if (user.requiresEmailVerification()) {
            throw new CustomException(ErrorCode.EMAIL_NOT_VERIFIED);
        }

        // 일일 사용량 초기화 체크 (날짜가 바뀌었으면 초기화)
        checkAndResetDailyUsage(user);

        // FREE 사용자 일일 제한 체크
        if (user.hasReachedDailyLimit()) {
            throw new CustomException(ErrorCode.EXECUTION_LIMIT_EXCEEDED);
        }

        AITool aiTool = aiToolRepository.findById(toolId)
                .orElseThrow(() -> new CustomException(ErrorCode.AI_TOOL_NOT_FOUND));

        // Pro 모델 사용 시 구독 검증
        String modelId = aiTool.getAiModel() != null ? aiTool.getAiModel() : "gemini-2.5-flash-lite";
        if (AIModel.isProModel(modelId) && !user.isPro()) {
            throw new CustomException(ErrorCode.PRO_SUBSCRIPTION_REQUIRED);
        }

        String userMessage = buildUserMessage(aiTool, request.getInputs());

        // Get maxLength from outputConfig and build enhanced system prompt
        int maxLength = getMaxLengthFromOutputConfig(aiTool);
        String enhancedSystemPrompt = buildEnhancedSystemPrompt(aiTool.getSystemPrompt(), maxLength);

        // maxTokens 계산 (한글 기준 약 2자당 1토큰, 마진 포함)
        int maxTokens = Math.max(512, (int) (maxLength * 0.7));

        // Increment user's daily usage count
        user.incrementDailyUsage();
        userRepository.save(user);

        SseEmitter emitter = new SseEmitter(300000L); // 5 minutes timeout

        // Execute in separate thread with selected model
        new Thread(() -> {
            geminiClient.chatStream(
                    enhancedSystemPrompt,
                    userMessage,
                    modelId,
                    0.7,
                    maxTokens,
                    emitter
            );
        }).start();

        return emitter;
    }

    // 일일 사용량 초기화 체크 (날짜가 바뀌었으면 초기화)
    private void checkAndResetDailyUsage(User user) {
        LocalDate today = LocalDate.now();
        if (user.getLastUsageResetDate() == null || !user.getLastUsageResetDate().equals(today)) {
            user.resetDailyUsage();
        }
    }

    private String buildUserMessage(AITool aiTool, Map<String, Object> inputs) {
        StringBuilder message = new StringBuilder();

        if (inputs == null || inputs.isEmpty()) {
            log.warn("Inputs is null or empty");
            return message.toString();
        }

        log.info("Building user message with inputs: {}", inputs);
        log.info("AITool inputFields: {}", aiTool.getInputFields());

        try {
            if (aiTool.getInputFields() != null && !aiTool.getInputFields().isEmpty()) {
                List<AIToolDto.InputField> fields = objectMapper.readValue(
                        aiTool.getInputFields(),
                        new TypeReference<List<AIToolDto.InputField>>() {}
                );

                log.info("Parsed fields: {}", fields.stream().map(f -> f.getName() + ":" + f.getLabel()).collect(Collectors.toList()));
                log.info("Input keys: {}", inputs.keySet());

                for (AIToolDto.InputField field : fields) {
                    Object value = inputs.get(field.getName());
                    log.info("Field name: {}, value from inputs: {}", field.getName(), value);
                    if (value == null || value.toString().isEmpty()) continue;

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
            } else {
                // No input fields defined - use inputs directly
                inputs.forEach((key, value) -> {
                    if (value != null && !value.toString().isEmpty()) {
                        message.append("## ").append(key).append("\n");
                        message.append(value.toString()).append("\n\n");
                    }
                });
            }
        } catch (JsonProcessingException e) {
            log.error("Failed to parse input fields", e);
            // Fallback: just append all inputs
            inputs.forEach((key, value) -> {
                if (value != null && !value.toString().isEmpty()) {
                    message.append("## ").append(key).append("\n");
                    message.append(value.toString()).append("\n\n");
                }
            });
        }

        log.info("Final user message: {}", message.toString());
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

    /**
     * outputConfig JSON에서 maxLength 값을 추출
     */
    private int getMaxLengthFromOutputConfig(AITool aiTool) {
        if (aiTool.getOutputConfig() == null || aiTool.getOutputConfig().isEmpty()) {
            return 2000; // 기본값
        }
        try {
            AIToolDto.OutputConfig outputConfig = objectMapper.readValue(
                    aiTool.getOutputConfig(), AIToolDto.OutputConfig.class);
            return outputConfig.getMaxLength() != null ? outputConfig.getMaxLength() : 2000;
        } catch (JsonProcessingException e) {
            log.warn("Failed to parse outputConfig, using default maxLength", e);
            return 2000;
        }
    }

    /**
     * advancedSettings JSON에서 설정 값들을 추출
     */
    private AIToolDto.AdvancedSettings getAdvancedSettings(AITool aiTool) {
        // advancedSettings 파싱 시도 (AITool 엔티티에 해당 필드가 있다면)
        // 현재는 기본값 반환
        return new AIToolDto.AdvancedSettings();
    }

    /**
     * 시스템 프롬프트에 길이 제한 지침을 추가하여 자연스럽게 끝나도록 함
     */
    private String buildEnhancedSystemPrompt(String originalPrompt, int maxLength) {
        StringBuilder enhanced = new StringBuilder(originalPrompt);
        enhanced.append("\n\n---\n");
        enhanced.append("## 중요 지침 (응답 형식)\n");
        enhanced.append("- 응답은 반드시 ").append(maxLength).append("자 이내로 작성하세요.\n");
        enhanced.append("- 응답이 중간에 끊기지 않도록 자연스럽게 문장을 마무리하세요.\n");
        enhanced.append("- 내용이 길어질 경우, 핵심 내용을 우선하여 간결하게 작성하세요.\n");
        enhanced.append("- 마지막 문장은 반드시 완전한 문장으로 끝내세요.\n");
        enhanced.append("- 글자 수 제한 때문에 내용이 부족해 보이면 안 됩니다. 제한 내에서 완결성 있게 작성하세요.\n");
        return enhanced.toString();
    }

    /**
     * Base64 인코딩된 이미지를 S3에 저장하고 URL 반환
     */
    private String saveBase64ImageToS3(String base64Data, String mimeType) {
        return s3Service.uploadBase64Image(base64Data, mimeType);
    }
}
