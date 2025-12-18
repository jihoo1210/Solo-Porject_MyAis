package com.myais.infra.openai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.myais.global.exception.CustomException;
import com.myais.global.exception.ErrorCode;
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
public class OpenAIClient {

    @Value("${openai.api-key}")
    private String apiKey;

    @Value("${openai.model:gpt-4o-mini}")
    private String defaultModel;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private static final String API_URL = "https://api.openai.com/v1/chat/completions";

    public OpenAIClient(ObjectMapper objectMapper) {
        this.restTemplate = new RestTemplate();
        this.objectMapper = objectMapper;
    }

    public String chat(String systemPrompt, String userMessage) {
        return chat(systemPrompt, userMessage, defaultModel, 0.7, 2048);
    }

    public String chat(String systemPrompt, String userMessage, String model, double temperature, int maxTokens) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model);
            requestBody.put("temperature", temperature);
            requestBody.put("max_tokens", maxTokens);

            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", systemPrompt));
            messages.add(Map.of("role", "user", "content", userMessage));
            requestBody.put("messages", messages);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            ResponseEntity<JsonNode> response = restTemplate.exchange(
                    API_URL,
                    HttpMethod.POST,
                    request,
                    JsonNode.class
            );

            JsonNode body = response.getBody();
            if (body != null && body.has("choices") && body.get("choices").size() > 0) {
                return body.get("choices").get(0).get("message").get("content").asText();
            }

            throw new CustomException(ErrorCode.EXECUTION_FAILED);
        } catch (Exception e) {
            log.error("OpenAI API call failed", e);
            throw new CustomException(ErrorCode.EXECUTION_FAILED, e.getMessage());
        }
    }

    public String chatWithVision(String systemPrompt, String userMessage, List<String> imageUrls, String model) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model.contains("vision") ? model : "gpt-4o");
            requestBody.put("max_tokens", 4096);

            List<Map<String, Object>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", systemPrompt));

            // User message with images
            List<Map<String, Object>> userContent = new ArrayList<>();
            userContent.add(Map.of("type", "text", "text", userMessage));

            for (String imageUrl : imageUrls) {
                userContent.add(Map.of(
                        "type", "image_url",
                        "image_url", Map.of("url", imageUrl)
                ));
            }

            messages.add(Map.of("role", "user", "content", userContent));
            requestBody.put("messages", messages);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

            ResponseEntity<JsonNode> response = restTemplate.exchange(
                    API_URL,
                    HttpMethod.POST,
                    request,
                    JsonNode.class
            );

            JsonNode body = response.getBody();
            if (body != null && body.has("choices") && body.get("choices").size() > 0) {
                return body.get("choices").get(0).get("message").get("content").asText();
            }

            throw new CustomException(ErrorCode.EXECUTION_FAILED);
        } catch (Exception e) {
            log.error("OpenAI Vision API call failed", e);
            throw new CustomException(ErrorCode.EXECUTION_FAILED, e.getMessage());
        }
    }

    public void chatStream(String systemPrompt, String userMessage, String model,
                           double temperature, int maxTokens, SseEmitter emitter) {
        try {
            URL url = new URL(API_URL);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Authorization", "Bearer " + apiKey);
            conn.setDoOutput(true);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model);
            requestBody.put("temperature", temperature);
            requestBody.put("max_tokens", maxTokens);
            requestBody.put("stream", true);

            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", systemPrompt));
            messages.add(Map.of("role", "user", "content", userMessage));
            requestBody.put("messages", messages);

            String jsonBody = objectMapper.writeValueAsString(requestBody);
            conn.getOutputStream().write(jsonBody.getBytes());

            BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
            String line;

            while ((line = reader.readLine()) != null) {
                if (line.startsWith("data: ")) {
                    String data = line.substring(6);
                    if ("[DONE]".equals(data)) {
                        emitter.complete();
                        break;
                    }

                    JsonNode node = objectMapper.readTree(data);
                    if (node.has("choices") && node.get("choices").size() > 0) {
                        JsonNode delta = node.get("choices").get(0).get("delta");
                        if (delta.has("content")) {
                            String content = delta.get("content").asText();
                            emitter.send(SseEmitter.event().data(content));
                        }
                    }
                }
            }

            reader.close();
            conn.disconnect();
        } catch (Exception e) {
            log.error("OpenAI Stream API call failed", e);
            try {
                emitter.completeWithError(e);
            } catch (Exception ignored) {}
        }
    }
}
