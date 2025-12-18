package com.myais.domain.user.dto;

import com.myais.domain.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

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
        private LocalDateTime createdAt;

        public static Response from(User user) {
            return Response.builder()
                    .id(user.getId())
                    .email(user.getEmail())
                    .name(user.getName())
                    .avatarUrl(user.getAvatarUrl())
                    .subscription(user.getSubscription())
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
