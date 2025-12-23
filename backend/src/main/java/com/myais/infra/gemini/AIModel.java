package com.myais.infra.gemini;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AIModel {
    // Free tier models (Gemini 2.0)
    GEMINI_2_FLASH_LITE("gemini-2.0-flash-lite", "Gemini 2.0 Flash Lite", "초고속 경량 모델 (무료)", false, false),

    // Gemini 2.5 models
    GEMINI_25_FLASH_LITE("gemini-2.5-flash-lite", "Gemini 2.5 Flash Lite", "빠르고 효율적인 모델 (무료)", false, false),
    GEMINI_25_FLASH("gemini-2.5-flash", "Gemini 2.5 Flash", "균형 잡힌 성능 모델", true, false),
    GEMINI_25_PRO("gemini-2.5-pro", "Gemini 2.5 Pro", "고급 추론 및 코딩 모델", true, false),

    // Gemini 3 models (Latest - Dec 2025)
    GEMINI_3_FLASH("gemini-3-flash", "Gemini 3 Flash", "최신 고속 모델 (2025.12)", true, false),
    GEMINI_3_PRO("gemini-3-pro", "Gemini 3 Pro", "최고 성능 추론 모델 (1M 컨텍스트)", true, false),

    // Image Generation models
    GEMINI_IMAGE("gemini-2.0-flash-preview-image-generation", "Gemini Image", "이미지 생성 모델", true, true);

    private final String modelId;
    private final String displayName;
    private final String description;
    private final boolean proRequired;
    private final boolean imageGeneration;

    public static AIModel fromModelId(String modelId) {
        if (modelId == null || modelId.isEmpty()) {
            return GEMINI_25_FLASH_LITE;
        }
        for (AIModel model : values()) {
            if (model.getModelId().equals(modelId)) {
                return model;
            }
        }
        return GEMINI_25_FLASH_LITE;
    }

    public static boolean isProModel(String modelId) {
        AIModel model = fromModelId(modelId);
        return model.isProRequired();
    }

    public static boolean isImageGenerationModel(String modelId) {
        AIModel model = fromModelId(modelId);
        return model.isImageGeneration();
    }
}
