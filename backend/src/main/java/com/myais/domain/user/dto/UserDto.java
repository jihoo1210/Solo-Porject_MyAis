package com.myais.domain.user.dto;

import com.myais.domain.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public class UserDto {

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private UUID id;
        private String email;
        private String name;
        private String avatarUrl;
        private String subscription;
        private LocalDateTime subscriptionExpiresAt;
        private Integer dailyUsageCount;
        private Integer dailyUsageLimit;
        private LocalDate lastUsageResetDate;
        private LocalDateTime createdAt;

        public static Response from(User user) {
            return Response.builder()
                    .id(user.getId())
                    .email(user.getEmail())
                    .name(user.getName())
                    .avatarUrl(user.getAvatarUrl())
                    .subscription(user.getSubscription())
                    .subscriptionExpiresAt(user.getSubscriptionExpiresAt())
                    .dailyUsageCount(user.getDailyUsageCount() != null ? user.getDailyUsageCount() : 0)
                    .dailyUsageLimit("PRO".equals(user.getSubscription()) ? -1 : 20) // -1 = 무제한
                    .lastUsageResetDate(user.getLastUsageResetDate())
                    .createdAt(user.getCreatedAt())
                    .build();
        }
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        private String name;
        private String avatarUrl;
    }
}
