package com.myais.domain.user.service;

import com.myais.domain.user.dto.AuthDto;
import com.myais.domain.user.dto.UserDto;
import com.myais.domain.user.entity.User;
import com.myais.domain.user.repository.UserRepository;
import com.myais.global.exception.CustomException;
import com.myais.global.exception.ErrorCode;
import com.myais.global.security.JwtTokenProvider;
import com.myais.infra.email.EmailService;
import com.myais.infra.redis.VerificationTokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final EmailService emailService;
    private final VerificationTokenService verificationTokenService;

    @Transactional
    public AuthDto.TokenResponse signup(AuthDto.SignupRequest request) {
        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new CustomException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        // Create user (emailVerified = false by default)
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .emailVerified(false)
                .build();

        userRepository.save(user);

        // Create and send verification email
        sendVerificationEmail(user);

        // Generate tokens (user can login but with limited access until verified)
        String accessToken = jwtTokenProvider.generateToken(user.getId(), user.getEmail());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId());

        return AuthDto.TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(UserDto.Response.from(user))
                .build();
    }

    private void sendVerificationEmail(User user) {
        // Create verification token in Redis (auto-expires after 24 hours)
        String token = verificationTokenService.createEmailVerificationToken(user.getId());

        // Send email
        try {
            emailService.sendVerificationEmail(user.getEmail(), user.getName(), token);
        } catch (Exception e) {
            log.error("Failed to send verification email to: {}", user.getEmail(), e);
            // Don't throw exception - user can request resend later
        }
    }

    public AuthDto.TokenResponse login(AuthDto.LoginRequest request) {
        // Find user
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new CustomException(ErrorCode.INVALID_PASSWORD);
        }

        // Generate tokens
        String accessToken = jwtTokenProvider.generateToken(user.getId(), user.getEmail());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId());

        return AuthDto.TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(UserDto.Response.from(user))
                .build();
    }

    public AuthDto.TokenResponse refresh(String refreshToken) {
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new CustomException(ErrorCode.INVALID_TOKEN);
        }

        UUID userId = jwtTokenProvider.getUserIdFromToken(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        String newAccessToken = jwtTokenProvider.generateToken(user.getId(), user.getEmail());
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(user.getId());

        return AuthDto.TokenResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .user(UserDto.Response.from(user))
                .build();
    }

    public UserDto.Response getMe(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        return UserDto.Response.from(user);
    }

    @Transactional
    public UserDto.Response updateProfile(UUID userId, String name) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        user.setName(name);
        userRepository.save(user);

        return UserDto.Response.from(user);
    }

    @Transactional
    public void changePassword(UUID userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        // OAuth 사용자는 비밀번호 변경 불가
        if (user.getProvider() != null && !user.getProvider().isEmpty()) {
            throw new CustomException(ErrorCode.INVALID_REQUEST);
        }

        // 현재 비밀번호 확인
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new CustomException(ErrorCode.INVALID_PASSWORD);
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @Transactional
    public void deleteAccount(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        userRepository.delete(user);
    }

    // 이메일 인증 확인
    @Transactional
    public void verifyEmail(String token) {
        // Redis에서 토큰 검증 및 사용자 ID 조회
        UUID userId = verificationTokenService.validateEmailVerificationToken(token);

        if (userId == null) {
            throw new CustomException(ErrorCode.VERIFICATION_TOKEN_NOT_FOUND);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        if (user.isEmailVerified()) {
            throw new CustomException(ErrorCode.EMAIL_ALREADY_VERIFIED);
        }

        // 이메일 인증 처리
        user.verifyEmail();
        userRepository.save(user);

        // 토큰 소비 (Redis에서 삭제)
        verificationTokenService.consumeEmailVerificationToken(token);
    }

    // 인증 이메일 재발송
    public void resendVerificationEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        if (user.isEmailVerified()) {
            throw new CustomException(ErrorCode.EMAIL_ALREADY_VERIFIED);
        }

        sendVerificationEmail(user);
    }

    // 비밀번호 찾기 (재설정 이메일 발송)
    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email).orElse(null);

        // 보안상 사용자 존재 여부와 관계없이 성공 응답
        if (user == null) {
            log.info("Password reset requested for non-existent email: {}", email);
            return;
        }

        // SNS 로그인 사용자는 비밀번호 재설정 불가
        if (user.getProvider() != null && !user.getProvider().isEmpty()) {
            log.info("Password reset requested for OAuth user: {}", email);
            return;
        }

        // Create password reset token in Redis (auto-expires after 1 hour)
        String token = verificationTokenService.createPasswordResetToken(user.getId());

        // Send email
        try {
            emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), token);
        } catch (Exception e) {
            log.error("Failed to send password reset email to: {}", user.getEmail(), e);
            throw new CustomException(ErrorCode.EMAIL_SEND_FAILED);
        }
    }

    // 비밀번호 재설정
    @Transactional
    public void resetPassword(String token, String newPassword) {
        // Redis에서 토큰 검증 및 사용자 ID 조회
        UUID userId = verificationTokenService.validatePasswordResetToken(token);

        if (userId == null) {
            throw new CustomException(ErrorCode.VERIFICATION_TOKEN_NOT_FOUND);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        // 비밀번호 변경
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // 토큰 소비 (Redis에서 삭제)
        verificationTokenService.consumePasswordResetToken(token);
    }

    // 토큰 유효성 검사 (프론트엔드에서 페이지 렌더링 전 확인용)
    public boolean validateResetToken(String token) {
        return verificationTokenService.isPasswordResetTokenValid(token);
    }
}
