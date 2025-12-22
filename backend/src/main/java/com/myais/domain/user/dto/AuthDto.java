package com.myais.domain.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

public class AuthDto {

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SignupRequest {
        @NotBlank(message = "이메일을 입력해주세요.")
        @Email(message = "올바른 이메일 형식이 아닙니다.")
        private String email;

        @NotBlank(message = "비밀번호를 입력해주세요.")
        @Size(min = 8, max = 100, message = "비밀번호는 8자 이상이어야 합니다.")
        private String password;

        @NotBlank(message = "이름을 입력해주세요.")
        @Size(min = 2, max = 50, message = "이름은 2자 이상 50자 이하여야 합니다.")
        private String name;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginRequest {
        @NotBlank(message = "이메일을 입력해주세요.")
        @Email(message = "올바른 이메일 형식이 아닙니다.")
        private String email;

        @NotBlank(message = "비밀번호를 입력해주세요.")
        private String password;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TokenResponse {
        private String accessToken;
        private String refreshToken;
        private UserDto.Response user;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RefreshRequest {
        @NotBlank(message = "리프레시 토큰이 필요합니다.")
        private String refreshToken;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProfileUpdateRequest {
        @NotBlank(message = "이름을 입력해주세요.")
        @Size(min = 2, max = 50, message = "이름은 2자 이상 50자 이하여야 합니다.")
        private String name;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PasswordChangeRequest {
        @NotBlank(message = "현재 비밀번호를 입력해주세요.")
        private String currentPassword;

        @NotBlank(message = "새 비밀번호를 입력해주세요.")
        @Size(min = 8, max = 100, message = "비밀번호는 8자 이상이어야 합니다.")
        private String newPassword;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmailVerificationRequest {
        @NotBlank(message = "인증 토큰이 필요합니다.")
        private String token;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ForgotPasswordRequest {
        @NotBlank(message = "이메일을 입력해주세요.")
        @Email(message = "올바른 이메일 형식이 아닙니다.")
        private String email;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResetPasswordRequest {
        @NotBlank(message = "토큰이 필요합니다.")
        private String token;

        @NotBlank(message = "새 비밀번호를 입력해주세요.")
        @Size(min = 8, max = 100, message = "비밀번호는 8자 이상이어야 합니다.")
        private String newPassword;
    }

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResendVerificationRequest {
        @NotBlank(message = "이메일을 입력해주세요.")
        @Email(message = "올바른 이메일 형식이 아닙니다.")
        private String email;
    }
}
