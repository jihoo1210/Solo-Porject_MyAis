package com.myais.global.security;

import com.myais.domain.user.entity.User;
import com.myais.domain.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        OAuth2User oAuth2User = oauthToken.getPrincipal();
        String provider = oauthToken.getAuthorizedClientRegistrationId();

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String providerId = oAuth2User.getAttribute("sub");
        String picture = oAuth2User.getAttribute("picture");

        // Find or create user
        User user = userRepository.findByEmail(email)
                .orElseGet(() -> {
                    User newUser = User.builder()
                            .email(email)
                            .name(name)
                            .provider(provider)
                            .providerId(providerId)
                            .avatarUrl(picture)
                            .build();
                    return userRepository.save(newUser);
                });

        // Update user info if missing
        boolean needsUpdate = false;
        if (user.getProvider() == null) {
            user.setProvider(provider);
            user.setProviderId(providerId);
            needsUpdate = true;
        }
        if (user.getName() == null && name != null) {
            user.setName(name);
            needsUpdate = true;
        }
        if (user.getAvatarUrl() == null && picture != null) {
            user.setAvatarUrl(picture);
            needsUpdate = true;
        }
        if (needsUpdate) {
            userRepository.save(user);
        }

        // Generate JWT token
        String accessToken = jwtTokenProvider.generateToken(user.getId(), user.getEmail());

        // Redirect to frontend with token
        String redirectUrl = frontendUrl + "/oauth/callback?token=" + accessToken;
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
