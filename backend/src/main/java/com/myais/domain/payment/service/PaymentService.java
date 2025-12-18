package com.myais.domain.payment.service;

import com.myais.domain.payment.dto.PaymentDto;
import com.myais.domain.user.entity.User;
import com.myais.domain.user.repository.UserRepository;
import com.myais.global.exception.CustomException;
import com.myais.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final UserRepository userRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${toss.secret-key:test_sk_dummy}")
    private String tossSecretKey;

    @Value("${toss.api-url:https://api.tosspayments.com/v1}")
    private String tossApiUrl;

    public PaymentDto.SubscriptionResponse createSubscription(String email, String plan) {
        String orderId = "ORDER_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);

        // In a real implementation, you would create a billing key request here
        // For now, we just return the orderId for the client to use
        return PaymentDto.SubscriptionResponse.builder()
                .orderId(orderId)
                .checkoutUrl(null) // Client will use TossPayments SDK directly
                .build();
    }

    @Transactional
    public void verifyPayment(String email, String paymentKey, String orderId, Integer amount) {
        try {
            // Verify payment with TossPayments API
            String url = tossApiUrl + "/payments/confirm";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            String auth = Base64.getEncoder().encodeToString((tossSecretKey + ":").getBytes());
            headers.set("Authorization", "Basic " + auth);

            Map<String, Object> body = new HashMap<>();
            body.put("paymentKey", paymentKey);
            body.put("orderId", orderId);
            body.put("amount", amount);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            // Make API call to TossPayments
            restTemplate.postForObject(url, request, Map.class);

            // Update user subscription
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

            user.setSubscription("PRO");
            userRepository.save(user);

            log.info("Payment verified for user: {}, orderId: {}", email, orderId);
        } catch (Exception e) {
            log.error("Payment verification failed", e);
            throw new CustomException(ErrorCode.PAYMENT_FAILED);
        }
    }

    @Transactional
    public void cancelSubscription(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        user.setSubscription("FREE");
        userRepository.save(user);

        log.info("Subscription cancelled for user: {}", email);
    }
}
