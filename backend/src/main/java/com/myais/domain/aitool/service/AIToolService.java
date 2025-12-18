package com.myais.domain.aitool.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.myais.domain.aitool.dto.AIToolDto;
import com.myais.domain.aitool.entity.AITool;
import com.myais.domain.aitool.repository.AIToolRepository;
import com.myais.domain.favorite.entity.Favorite;
import com.myais.domain.favorite.repository.FavoriteRepository;
import com.myais.domain.user.entity.User;
import com.myais.domain.user.repository.UserRepository;
import com.myais.global.exception.CustomException;
import com.myais.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AIToolService {

    private final AIToolRepository aiToolRepository;
    private final UserRepository userRepository;
    private final FavoriteRepository favoriteRepository;
    private final ObjectMapper objectMapper;

    private static final int FREE_AI_LIMIT = 3;

    public List<AIToolDto.Response> getAllTools(UUID userId) {
        List<AITool> tools = aiToolRepository.findByUserIdOrIsDefaultTrue(userId);
        return tools.stream()
                .map(AIToolDto.Response::from)
                .collect(Collectors.toList());
    }

    public AIToolDto.Response getToolById(UUID toolId) {
        AITool tool = aiToolRepository.findById(toolId)
                .orElseThrow(() -> new CustomException(ErrorCode.AI_TOOL_NOT_FOUND));
        return AIToolDto.Response.from(tool);
    }

    public List<AIToolDto.Response> searchTools(UUID userId, String keyword) {
        List<AITool> tools = aiToolRepository.searchByKeyword(userId, keyword);
        return tools.stream()
                .map(AIToolDto.Response::from)
                .collect(Collectors.toList());
    }

    public List<AIToolDto.Response> getToolsByCategory(UUID userId, String category) {
        List<AITool> tools = aiToolRepository.findByUserIdAndCategory(userId, category);
        return tools.stream()
                .map(AIToolDto.Response::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public AIToolDto.Response createTool(UUID userId, AIToolDto.CreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        // Check AI tool limit for free users
        long userToolCount = aiToolRepository.findByUserId(userId).size();
        if (userToolCount >= FREE_AI_LIMIT) {
            // TODO: Check if user is PRO
            throw new CustomException(ErrorCode.AI_TOOL_LIMIT_EXCEEDED);
        }

        try {
            AITool aiTool = AITool.builder()
                    .user(user)
                    .name(request.getName())
                    .description(request.getDescription())
                    .icon(request.getIcon())
                    .category(request.getCategory())
                    .systemPrompt(request.getSystemPrompt())
                    .inputFields(request.getInputFields() != null ?
                            objectMapper.writeValueAsString(request.getInputFields()) : null)
                    .outputConfig(request.getOutputConfig() != null ?
                            objectMapper.writeValueAsString(request.getOutputConfig()) : null)
                    .isPublic(request.getIsPublic())
                    .isDefault(false)
                    .build();

            aiToolRepository.save(aiTool);
            return AIToolDto.Response.from(aiTool);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize AI tool data", e);
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    @Transactional
    public AIToolDto.Response updateTool(UUID userId, UUID toolId, AIToolDto.UpdateRequest request) {
        AITool aiTool = aiToolRepository.findById(toolId)
                .orElseThrow(() -> new CustomException(ErrorCode.AI_TOOL_NOT_FOUND));

        // Check ownership
        if (aiTool.getUser() == null || !aiTool.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }

        try {
            if (request.getName() != null) aiTool.setName(request.getName());
            if (request.getDescription() != null) aiTool.setDescription(request.getDescription());
            if (request.getIcon() != null) aiTool.setIcon(request.getIcon());
            if (request.getCategory() != null) aiTool.setCategory(request.getCategory());
            if (request.getSystemPrompt() != null) aiTool.setSystemPrompt(request.getSystemPrompt());
            if (request.getInputFields() != null) {
                aiTool.setInputFields(objectMapper.writeValueAsString(request.getInputFields()));
            }
            if (request.getOutputConfig() != null) {
                aiTool.setOutputConfig(objectMapper.writeValueAsString(request.getOutputConfig()));
            }
            if (request.getIsPublic() != null) aiTool.setIsPublic(request.getIsPublic());

            return AIToolDto.Response.from(aiTool);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize AI tool data", e);
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    @Transactional
    public void deleteTool(UUID userId, UUID toolId) {
        AITool aiTool = aiToolRepository.findById(toolId)
                .orElseThrow(() -> new CustomException(ErrorCode.AI_TOOL_NOT_FOUND));

        // Check ownership
        if (aiTool.getUser() == null || !aiTool.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }

        // Cannot delete default tools
        if (aiTool.getIsDefault()) {
            throw new CustomException(ErrorCode.ACCESS_DENIED, "기본 AI 도구는 삭제할 수 없습니다.");
        }

        aiToolRepository.delete(aiTool);
    }

    @Transactional
    public boolean toggleFavorite(UUID userId, UUID toolId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        AITool aiTool = aiToolRepository.findById(toolId)
                .orElseThrow(() -> new CustomException(ErrorCode.AI_TOOL_NOT_FOUND));

        boolean exists = favoriteRepository.existsByUserIdAndAiToolId(userId, toolId);

        if (exists) {
            favoriteRepository.deleteByUserIdAndAiToolId(userId, toolId);
            return false;
        } else {
            Favorite favorite = Favorite.builder()
                    .user(user)
                    .aiTool(aiTool)
                    .build();
            favoriteRepository.save(favorite);
            return true;
        }
    }

    public List<AIToolDto.Response> getFavorites(UUID userId) {
        List<Favorite> favorites = favoriteRepository.findByUserId(userId);
        return favorites.stream()
                .map(f -> AIToolDto.Response.from(f.getAiTool()))
                .collect(Collectors.toList());
    }
}
