package com.myais.domain.user.controller;

import com.myais.domain.user.dto.AuthDto;
import com.myais.domain.user.dto.UserDto;
import com.myais.domain.user.service.AuthService;
import com.myais.global.common.ApiResponse;
import com.myais.global.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ApiResponse<AuthDto.TokenResponse> signup(@Valid @RequestBody AuthDto.SignupRequest request) {
        return ApiResponse.success(authService.signup(request));
    }

    @PostMapping("/login")
    public ApiResponse<AuthDto.TokenResponse> login(@Valid @RequestBody AuthDto.LoginRequest request) {
        return ApiResponse.success(authService.login(request));
    }

    @PostMapping("/refresh")
    public ApiResponse<AuthDto.TokenResponse> refresh(@Valid @RequestBody AuthDto.RefreshRequest request) {
        return ApiResponse.success(authService.refresh(request.getRefreshToken()));
    }

    @GetMapping("/me")
    public ApiResponse<UserDto.Response> getMe(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(authService.getMe(userDetails.getUserId()));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout() {
        // JWT는 stateless이므로 서버에서 특별히 할 일은 없음
        // 클라이언트에서 토큰을 삭제하면 됨
        return ApiResponse.success(null, "로그아웃되었습니다.");
    }

    @PutMapping("/profile")
    public ApiResponse<UserDto.Response> updateProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody AuthDto.ProfileUpdateRequest request) {
        return ApiResponse.success(authService.updateProfile(userDetails.getUserId(), request.getName()));
    }

    @PutMapping("/password")
    public ApiResponse<Void> changePassword(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody AuthDto.PasswordChangeRequest request) {
        authService.changePassword(userDetails.getUserId(), request.getCurrentPassword(), request.getNewPassword());
        return ApiResponse.success(null, "비밀번호가 변경되었습니다.");
    }

    @DeleteMapping("/account")
    public ApiResponse<Void> deleteAccount(@AuthenticationPrincipal CustomUserDetails userDetails) {
        authService.deleteAccount(userDetails.getUserId());
        return ApiResponse.success(null, "계정이 삭제되었습니다.");
    }

    // 이메일 인증
    @PostMapping("/verify-email")
    public ApiResponse<Void> verifyEmail(@Valid @RequestBody AuthDto.EmailVerificationRequest request) {
        authService.verifyEmail(request.getToken());
        return ApiResponse.success(null, "이메일 인증이 완료되었습니다.");
    }

    // 인증 이메일 재발송
    @PostMapping("/resend-verification")
    public ApiResponse<Void> resendVerification(@Valid @RequestBody AuthDto.ResendVerificationRequest request) {
        authService.resendVerificationEmail(request.getEmail());
        return ApiResponse.success(null, "인증 이메일이 발송되었습니다.");
    }

    // 비밀번호 찾기 (재설정 이메일 발송)
    @PostMapping("/forgot-password")
    public ApiResponse<Void> forgotPassword(@Valid @RequestBody AuthDto.ForgotPasswordRequest request) {
        authService.forgotPassword(request.getEmail());
        return ApiResponse.success(null, "비밀번호 재설정 이메일이 발송되었습니다.");
    }

    // 비밀번호 재설정
    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody AuthDto.ResetPasswordRequest request) {
        authService.resetPassword(request.getToken(), request.getNewPassword());
        return ApiResponse.success(null, "비밀번호가 재설정되었습니다.");
    }

    // 비밀번호 재설정 토큰 유효성 검사
    @GetMapping("/validate-reset-token")
    public ApiResponse<Boolean> validateResetToken(@RequestParam String token) {
        boolean isValid = authService.validateResetToken(token);
        return ApiResponse.success(isValid);
    }
}
