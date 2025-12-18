package com.myais.domain.aitool.dto;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.myais.domain.aitool.entity.AITool;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class AIToolDto {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private UUID id;
        private UUID userId;
        private String name;
        private String description;
        private String icon;
        private String category;
        private String systemPrompt;
        private Object personality;
        private List<InputField> inputFields;
        private OutputConfig outputConfig;
        private AdvancedSettings advancedSettings;
        private Boolean isPublic;
        private Boolean isDefault;
        private Integer usageCount;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public static Response from(AITool aiTool) {
            ResponseBuilder builder = Response.builder()
                    .id(aiTool.getId())
                    .userId(aiTool.getUser() != null ? aiTool.getUser().getId() : null)
                    .name(aiTool.getName())
                    .description(aiTool.getDescription())
                    .icon(aiTool.getIcon())
                    .category(aiTool.getCategory())
                    .systemPrompt(aiTool.getSystemPrompt())
                    .isPublic(aiTool.getIsPublic())
                    .isDefault(aiTool.getIsDefault())
                    .usageCount(aiTool.getUsageCount())
                    .createdAt(aiTool.getCreatedAt())
                    .updatedAt(aiTool.getUpdatedAt());

            try {
                if (aiTool.getInputFields() != null) {
                    builder.inputFields(objectMapper.readValue(
                            aiTool.getInputFields(),
                            objectMapper.getTypeFactory().constructCollectionType(List.class, InputField.class)
                    ));
                }
                if (aiTool.getOutputConfig() != null) {
                    builder.outputConfig(objectMapper.readValue(aiTool.getOutputConfig(), OutputConfig.class));
                }
            } catch (JsonProcessingException e) {
                // Ignore parsing errors
            }

            return builder.build();
        }
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        @NotBlank(message = "이름을 입력해주세요.")
        @Size(max = 100, message = "이름은 100자 이하여야 합니다.")
        private String name;

        @Size(max = 500, message = "설명은 500자 이하여야 합니다.")
        private String description;

        private String icon = "🤖";
        private String category = "other";

        @NotBlank(message = "시스템 프롬프트를 입력해주세요.")
        private String systemPrompt;

        private Object personality;
        private List<InputField> inputFields;
        private OutputConfig outputConfig;
        private AdvancedSettings advancedSettings;
        private Boolean isPublic = false;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        private String name;
        private String description;
        private String icon;
        private String category;
        private String systemPrompt;
        private Object personality;
        private List<InputField> inputFields;
        private OutputConfig outputConfig;
        private AdvancedSettings advancedSettings;
        private Boolean isPublic;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InputField {
        private String id;
        private String type;
        private String name;
        private String label;
        private String placeholder;
        private Boolean required;
        private List<String> options;
        private Integer min;
        private Integer max;
        private Integer order;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OutputConfig {
        private String format = "markdown";
        private Boolean showCopy = true;
        private Boolean showRegenerate = true;
        private Boolean showDownload = false;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdvancedSettings {
        private String model = "gpt-4o-mini";
        private Double temperature = 0.7;
        private Integer maxTokens = 2048;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Personality {
        private String preset;
        private ToneSettings tone;
        private StyleSettings style;
        private List<String> expertise;
        private String role;
        private Instructions instructions;
        private List<String> restrictions;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ToneSettings {
        private Integer formality = 50;
        private Integer friendliness = 50;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StyleSettings {
        private Integer verbosity = 50;
        private Integer creativity = 50;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Instructions {
        private Boolean useEmoji = false;
        private Boolean useMarkdown = true;
        private Boolean includeExamples = false;
        private Boolean stepByStep = false;
        private Boolean useCodeBlocks = false;
        private Boolean preferTables = false;
    }
}
