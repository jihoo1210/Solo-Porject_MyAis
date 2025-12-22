package com.myais.domain.aitool.entity;

import com.myais.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ai_tools")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AITool {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(length = 10)
    private String icon;

    @Column(length = 50)
    private String category;

    @Column(name = "system_prompt", columnDefinition = "TEXT")
    private String systemPrompt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "input_fields", columnDefinition = "TEXT")
    private String inputFields;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "output_config", columnDefinition = "TEXT")
    private String outputConfig;

    @Column(name = "ai_model", length = 50)
    @Builder.Default
    private String aiModel = "gemini-2.5-flash-lite";

    @Column(name = "is_public")
    @Builder.Default
    private Boolean isPublic = false;

    @Column(name = "is_default")
    @Builder.Default
    private Boolean isDefault = false;

    @Column(name = "usage_count")
    @Builder.Default
    private Integer usageCount = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public void incrementUsageCount() {
        this.usageCount++;
    }
}
