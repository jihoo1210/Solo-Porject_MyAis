package com.myais.domain.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column
    private String password;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(length = 20)
    private String provider;

    @Column(name = "provider_id")
    private String providerId;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(length = 20)
    @Builder.Default
    private String subscription = "FREE";

    @Column(name = "subscription_expires_at")
    private LocalDateTime subscriptionExpiresAt;

    @Column(name = "daily_usage_count")
    @Builder.Default
    private Integer dailyUsageCount = 0;

    @Column(name = "last_usage_reset_date")
    private LocalDate lastUsageResetDate;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // 일일 사용량 증가
    public void incrementDailyUsage() {
        this.dailyUsageCount++;
    }

    // 일일 사용량 초기화
    public void resetDailyUsage() {
        this.dailyUsageCount = 0;
        this.lastUsageResetDate = LocalDate.now();
    }

    // FREE 사용자의 일일 제한 도달 여부 확인
    public boolean hasReachedDailyLimit() {
        if (!"FREE".equals(this.subscription)) {
            return false; // PRO 사용자는 무제한
        }
        return this.dailyUsageCount >= 20;
    }

    // 구독 만료 여부 확인
    public boolean isSubscriptionExpired() {
        if (this.subscriptionExpiresAt == null) {
            return true;
        }
        return LocalDateTime.now().isAfter(this.subscriptionExpiresAt);
    }

    // PRO 구독 설정 (30일)
    public void activateProSubscription() {
        this.subscription = "PRO";
        this.subscriptionExpiresAt = LocalDateTime.now().plusDays(30);
    }

    // 구독 만료 처리
    public void expireSubscription() {
        this.subscription = "FREE";
        this.subscriptionExpiresAt = null;
    }
}
