package com.myais.infra.gemini;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.myais.global.exception.CustomException;
import com.myais.global.exception.ErrorCode;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.*;

@Slf4j
@Component
public class GeminiClient {

    @Value("${gemini.api-key}")
    private String apiKey;

    @Value("${gemini.model:gemini-2.0-flash-lite}")
    private String defaultModel;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private static final String API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";

    public GeminiClient(ObjectMapper objectMapper) {
        this.restTemplate = new RestTemplate();
        this.objectMapper = objectMapper;
    }

    // 응답 클래스 - 텍스트와 토큰 사용량 포함
    @Getter
    @AllArgsConstructor
    public static class ChatResponse {
        private String text;
        private Integer totalTokens;
    }

    public ChatResponse chat(String systemPrompt, String userMessage) {
        return chat(systemPrompt, userMessage, defaultModel, 0.7, 2048);
    }

    public ChatResponse chat(String systemPrompt, String userMessage, String model, double temperature, int maxTokens) {
        try {
            String apiUrl = API_BASE_URL + model + ":generateContent?key=" + apiKey;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> requestBody = new HashMap<>();

            // System instruction
            requestBody.put("systemInstruction", Map.of(
                "parts", List.of(Map.of("text", systemPrompt))
            ));

            // User content
            requestBody.put("contents", List.of(
                Map.of("parts", List.of(Map.of("text", userMessage)))
            ));

            // Generation config
            requestBody.put("generationConfig", Map.of(
                "temperature", temperature,
                "maxOutputTokens", maxTokens
            ));

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            ResponseEntity<JsonNode> response = restTemplate.exchange(
                    apiUrl,
                    HttpMethod.POST,
                    request,
                    JsonNode.class
            );

            JsonNode body = response.getBody();
            if (body != null && body.has("candidates") && body.get("candidates").size() > 0) {
                JsonNode content = body.get("candidates").get(0).get("content");
                if (content != null && content.has("parts") && content.get("parts").size() > 0) {
                    String text = content.get("parts").get(0).get("text").asText();

                    // 토큰 사용량 추출
                    Integer totalTokens = null;
                    if (body.has("usageMetadata")) {
                        JsonNode usageMetadata = body.get("usageMetadata");
                        if (usageMetadata.has("totalTokenCount")) {
                            totalTokens = usageMetadata.get("totalTokenCount").asInt();
                        }
                    }

                    return new ChatResponse(text, totalTokens);
                }
            }

            throw new CustomException(ErrorCode.EXECUTION_FAILED);
        } catch (Exception e) {
            log.error("Gemini API call failed", e);
            throw new CustomException(ErrorCode.EXECUTION_FAILED, e.getMessage());
        }
    }

    public String chatWithVision(String systemPrompt, String userMessage, List<String> imageUrls, String model) {
        try {
            String apiUrl = API_BASE_URL + model + ":generateContent?key=" + apiKey;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> requestBody = new HashMap<>();

            // System instruction
            requestBody.put("systemInstruction", Map.of(
                "parts", List.of(Map.of("text", systemPrompt))
            ));

            // User content with images
            List<Map<String, Object>> parts = new ArrayList<>();
            parts.add(Map.of("text", userMessage));

            for (String imageUrl : imageUrls) {
                parts.add(Map.of(
                    "inlineData", Map.of(
                        "mimeType", "image/jpeg",
                        "data", imageUrl // Base64 encoded or fetch from URL
                    )
                ));
            }

            requestBody.put("contents", List.of(Map.of("parts", parts)));

            requestBody.put("generationConfig", Map.of(
                "maxOutputTokens", 4096
            ));

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            ResponseEntity<JsonNode> response = restTemplate.exchange(
                    apiUrl,
                    HttpMethod.POST,
                    request,
                    JsonNode.class
            );

            JsonNode body = response.getBody();
            if (body != null && body.has("candidates") && body.get("candidates").size() > 0) {
                JsonNode content = body.get("candidates").get(0).get("content");
                if (content != null && content.has("parts") && content.get("parts").size() > 0) {
                    return content.get("parts").get(0).get("text").asText();
                }
            }

            throw new CustomException(ErrorCode.EXECUTION_FAILED);
        } catch (Exception e) {
            log.error("Gemini Vision API call failed", e);
            throw new CustomException(ErrorCode.EXECUTION_FAILED, e.getMessage());
        }
    }

    public void chatStream(String systemPrompt, String userMessage, String model,
                           double temperature, int maxTokens, SseEmitter emitter) {
        try {
            String apiUrl = API_BASE_URL + model + ":streamGenerateContent?alt=sse&key=" + apiKey;

            URL url = new URL(apiUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);

            Map<String, Object> requestBody = new HashMap<>();

            // System instruction
            requestBody.put("systemInstruction", Map.of(
                "parts", List.of(Map.of("text", systemPrompt))
            ));

            // User content
            requestBody.put("contents", List.of(
                Map.of("parts", List.of(Map.of("text", userMessage)))
            ));

            // Generation config
            requestBody.put("generationConfig", Map.of(
                "temperature", temperature,
                "maxOutputTokens", maxTokens
            ));

            String jsonBody = objectMapper.writeValueAsString(requestBody);
            conn.getOutputStream().write(jsonBody.getBytes());

            BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
            String line;

            while ((line = reader.readLine()) != null) {
                if (line.startsWith("data: ")) {
                    String data = line.substring(6);

                    JsonNode node = objectMapper.readTree(data);
                    if (node.has("candidates") && node.get("candidates").size() > 0) {
                        JsonNode content = node.get("candidates").get(0).get("content");
                        if (content != null && content.has("parts") && content.get("parts").size() > 0) {
                            String text = content.get("parts").get(0).get("text").asText();
                            emitter.send(SseEmitter.event().data(text));
                        }
                    }
                }
            }

            emitter.complete();
            reader.close();
            conn.disconnect();
        } catch (Exception e) {
            log.error("Gemini Stream API call failed", e);
            try {
                emitter.completeWithError(e);
            } catch (Exception ignored) {}
        }
    }
}
