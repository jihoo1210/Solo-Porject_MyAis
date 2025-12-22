package com.myais.global.config;

import com.myais.domain.user.entity.User;
import com.myais.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        createAdminUser();
    }

    private void createAdminUser() {
        String adminEmail = "admin@test.com";

        // 이미 존재하는지 확인
        if (userRepository.findByEmail(adminEmail).isPresent()) {
            log.info("Admin user already exists: {}", adminEmail);
            return;
        }

        User admin = User.builder()
                .email(adminEmail)
                .password(passwordEncoder.encode("admin123"))
                .name("Admin")
                .emailVerified(true)
                .subscription("PRO")
                .subscriptionExpiresAt(LocalDateTime.now().plusYears(100)) // 100년 후 만료
                .build();

        userRepository.save(admin);
        log.info("Admin user created: {}", adminEmail);
    }
}
