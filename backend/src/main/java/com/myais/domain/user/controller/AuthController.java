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
}
