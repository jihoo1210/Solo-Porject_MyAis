package com.myais.domain.execution.dto;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.myais.domain.execution.entity.Execution;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class ExecutionDto {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExecuteRequest {
        private Map<String, Object> inputs;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExecuteResponse {
        private UUID id;
        private String result;
        private Usage usage;
        private LocalDateTime createdAt;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Usage {
        private Integer promptTokens;
        private Integer completionTokens;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private UUID id;
        private UUID userId;
        private UUID aiToolId;
        private String aiToolName;
        private String aiToolIcon;
        private Map<String, Object> inputData;
        private String output;
        private Boolean isFavorite;
        private Long executionTime; // 밀리초 단위
        private Integer tokensUsed;
        private LocalDateTime createdAt;

        public static Response from(Execution execution) {
            ResponseBuilder builder = Response.builder()
                    .id(execution.getId())
                    .userId(execution.getUser().getId())
                    .aiToolId(execution.getAiTool().getId())
                    .aiToolName(execution.getAiTool().getName())
                    .aiToolIcon(execution.getAiTool().getIcon())
                    .output(execution.getOutput())
                    .isFavorite(execution.getIsFavorite())
                    .executionTime(execution.getExecutionTime())
                    .tokensUsed(execution.getTokensUsed())
                    .createdAt(execution.getCreatedAt());

            try {
                if (execution.getInputData() != null) {
                    builder.inputData(objectMapper.readValue(
                            execution.getInputData(),
                            new TypeReference<Map<String, Object>>() {}
                    ));
                }
            } catch (JsonProcessingException e) {
                // Ignore
            }

            return builder.build();
        }
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PageResponse {
        private List<Response> content;
        private Long totalElements;
        private Integer totalPages;
        private Integer page;
        private Integer size;
    }
}
