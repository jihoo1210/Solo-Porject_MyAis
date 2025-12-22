package com.myais.infra.redis;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class VerificationTokenService {

    private final StringRedisTemplate redisTemplate;

    // Redis key prefixes
    private static final String EMAIL_VERIFICATION_PREFIX = "email_verification:";
    private static final String PASSWORD_RESET_PREFIX = "password_reset:";

    // TTL 설정
    private static final Duration EMAIL_VERIFICATION_TTL = Duration.ofHours(24);
    private static final Duration PASSWORD_RESET_TTL = Duration.ofHours(1);

    /**
     * 이메일 인증 토큰 생성 및 저장
     * @param userId 사용자 ID
     * @return 생성된 토큰
     */
    public String createEmailVerificationToken(UUID userId) {
        String token = UUID.randomUUID().toString();
        String key = EMAIL_VERIFICATION_PREFIX + token;

        // 기존 토큰 삭제 (사용자 ID로 역참조 키 저장)
        deleteExistingTokenByUserId(EMAIL_VERIFICATION_PREFIX, userId);

        // 토큰 -> userId 매핑 저장
        redisTemplate.opsForValue().set(key, userId.toString(), EMAIL_VERIFICATION_TTL);

        // userId -> 토큰 역참조 저장 (재발송 시 기존 토큰 삭제용)
        String reverseKey = EMAIL_VERIFICATION_PREFIX + "user:" + userId;
        redisTemplate.opsForValue().set(reverseKey, token, EMAIL_VERIFICATION_TTL);

        log.info("Email verification token created for user: {}", userId);
        return token;
    }

    /**
     * 비밀번호 재설정 토큰 생성 및 저장
     * @param userId 사용자 ID
     * @return 생성된 토큰
     */
    public String createPasswordResetToken(UUID userId) {
        String token = UUID.randomUUID().toString();
        String key = PASSWORD_RESET_PREFIX + token;

        // 기존 토큰 삭제
        deleteExistingTokenByUserId(PASSWORD_RESET_PREFIX, userId);

        // 토큰 -> userId 매핑 저장
        redisTemplate.opsForValue().set(key, userId.toString(), PASSWORD_RESET_TTL);

        // userId -> 토큰 역참조 저장
        String reverseKey = PASSWORD_RESET_PREFIX + "user:" + userId;
        redisTemplate.opsForValue().set(reverseKey, token, PASSWORD_RESET_TTL);

        log.info("Password reset token created for user: {}", userId);
        return token;
    }

    /**
     * 이메일 인증 토큰 검증 및 사용자 ID 반환
     * @param token 토큰
     * @return 사용자 ID (없으면 null)
     */
    public UUID validateEmailVerificationToken(String token) {
        String key = EMAIL_VERIFICATION_PREFIX + token;
        String userId = redisTemplate.opsForValue().get(key);

        if (userId == null) {
            log.warn("Email verification token not found or expired: {}", token);
            return null;
        }

        return UUID.fromString(userId);
    }

    /**
     * 비밀번호 재설정 토큰 검증 및 사용자 ID 반환
     * @param token 토큰
     * @return 사용자 ID (없으면 null)
     */
    public UUID validatePasswordResetToken(String token) {
        String key = PASSWORD_RESET_PREFIX + token;
        String userId = redisTemplate.opsForValue().get(key);

        if (userId == null) {
            log.warn("Password reset token not found or expired: {}", token);
            return null;
        }

        return UUID.fromString(userId);
    }

    /**
     * 이메일 인증 토큰 사용 처리 (삭제)
     * @param token 토큰
     */
    public void consumeEmailVerificationToken(String token) {
        String key = EMAIL_VERIFICATION_PREFIX + token;
        String userId = redisTemplate.opsForValue().get(key);

        if (userId != null) {
            // 토큰 삭제
            redisTemplate.delete(key);
            // 역참조 키도 삭제
            redisTemplate.delete(EMAIL_VERIFICATION_PREFIX + "user:" + userId);
            log.info("Email verification token consumed for user: {}", userId);
        }
    }

    /**
     * 비밀번호 재설정 토큰 사용 처리 (삭제)
     * @param token 토큰
     */
    public void consumePasswordResetToken(String token) {
        String key = PASSWORD_RESET_PREFIX + token;
        String userId = redisTemplate.opsForValue().get(key);

        if (userId != null) {
            // 토큰 삭제
            redisTemplate.delete(key);
            // 역참조 키도 삭제
            redisTemplate.delete(PASSWORD_RESET_PREFIX + "user:" + userId);
            log.info("Password reset token consumed for user: {}", userId);
        }
    }

    /**
     * 비밀번호 재설정 토큰 유효성 검사 (존재 여부만 확인)
     * @param token 토큰
     * @return 유효 여부
     */
    public boolean isPasswordResetTokenValid(String token) {
        String key = PASSWORD_RESET_PREFIX + token;
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    /**
     * 기존 토큰 삭제 (사용자 ID 기준)
     */
    private void deleteExistingTokenByUserId(String prefix, UUID userId) {
        String reverseKey = prefix + "user:" + userId;
        String existingToken = redisTemplate.opsForValue().get(reverseKey);

        if (existingToken != null) {
            redisTemplate.delete(prefix + existingToken);
            redisTemplate.delete(reverseKey);
            log.debug("Deleted existing token for user: {}", userId);
        }
    }
}
