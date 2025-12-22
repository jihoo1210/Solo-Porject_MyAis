package com.myais.infra.gemini;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AIModel {
    // Free tier models
    GEMINI_FLASH_LITE("gemini-2.5-flash-lite", "Gemini Flash Lite", "빠르고 가벼운 모델 (무료)", false),

    // Pro tier models
    GEMINI_FLASH("gemini-2.5-flash", "Gemini 2.5 Flash", "가격-성능 최적화 모델", true),
    GEMINI_PRO("gemini-2.5-pro", "Gemini 2.5 Pro", "고급 추론 모델", true),
    NANO_BANANA("gemini-3-flash-preview", "Nano Banana", "최신 Gemini 3 Flash (Preview)", true);

    private final String modelId;
    private final String displayName;
    private final String description;
    private final boolean proRequired;

    public static AIModel fromModelId(String modelId) {
        if (modelId == null || modelId.isEmpty()) {
            return GEMINI_FLASH_LITE;
        }
        for (AIModel model : values()) {
            if (model.getModelId().equals(modelId)) {
                return model;
            }
        }
        return GEMINI_FLASH_LITE;
    }

    public static boolean isProModel(String modelId) {
        AIModel model = fromModelId(modelId);
        return model.isProRequired();
    }
}
