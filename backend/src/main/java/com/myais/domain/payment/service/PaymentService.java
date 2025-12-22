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

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
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

    private static final int SUBSCRIPTION_AMOUNT = 9900;
    private static final String SUBSCRIPTION_ORDER_NAME = "MyAIs Pro 월간 구독";

    /**
     * customerKey 생성 또는 조회
     */
    public PaymentDto.CustomerKeyResponse getOrCreateCustomerKey(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        if (user.getCustomerKey() == null || user.getCustomerKey().isEmpty()) {
            String customerKey = "CUST_" + user.getId().toString().replace("-", "").substring(0, 16);
            user.setCustomerKey(customerKey);
            userRepository.save(user);
        }

        return PaymentDto.CustomerKeyResponse.builder()
                .customerKey(user.getCustomerKey())
                .build();
    }

    /**
     * authKey로 빌링키 발급
     * 프론트엔드에서 SDK로 카드 정보를 입력받아 authKey를 받은 후 호출
     */
    @Transactional
    public PaymentDto.BillingKeyResponse issueBillingKey(String email, PaymentDto.BillingKeyRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        try {
            String url = tossApiUrl + "/billing/authorizations/issue";

            HttpHeaders headers = createAuthHeaders();

            Map<String, Object> body = new HashMap<>();
            body.put("authKey", request.getAuthKey());
            body.put("customerKey", request.getCustomerKey());

            HttpEntity<Map<String, Object>> httpRequest = new HttpEntity<>(body, headers);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(url, httpRequest, Map.class);

            if (response != null) {
                String billingKey = (String) response.get("billingKey");
                String customerKey = (String) response.get("customerKey");

                @SuppressWarnings("unchecked")
                Map<String, Object> card = (Map<String, Object>) response.get("card");
                String cardCompany = card != null ? (String) card.get("company") : null;
                String cardNumber = card != null ? (String) card.get("number") : null;

                // 빌링키 저장
                user.setBillingKey(billingKey);
                user.setCustomerKey(customerKey);
                userRepository.save(user);

                log.info("Billing key issued for user: {}, customerKey: {}", email, customerKey);

                return PaymentDto.BillingKeyResponse.builder()
                        .success(true)
                        .message("빌링키가 성공적으로 발급되었습니다.")
                        .billingKey(billingKey)
                        .customerKey(customerKey)
                        .cardCompany(cardCompany)
                        .cardNumber(cardNumber)
                        .build();
            }

            throw new CustomException(ErrorCode.PAYMENT_FAILED);
        } catch (Exception e) {
            log.error("Failed to issue billing key", e);
            throw new CustomException(ErrorCode.PAYMENT_FAILED);
        }
    }

    /**
     * 빌링키로 정기 결제 실행
     */
    @Transactional
    public PaymentDto.BillingResponse executeBilling(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        if (user.getBillingKey() == null || user.getBillingKey().isEmpty()) {
            throw new CustomException(ErrorCode.PAYMENT_FAILED);
        }

        try {
            String url = tossApiUrl + "/billing/" + user.getBillingKey();
            String orderId = "ORDER_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);

            HttpHeaders headers = createAuthHeaders();

            Map<String, Object> body = new HashMap<>();
            body.put("customerKey", user.getCustomerKey());
            body.put("amount", SUBSCRIPTION_AMOUNT);
            body.put("orderId", orderId);
            body.put("orderName", SUBSCRIPTION_ORDER_NAME);

            HttpEntity<Map<String, Object>> httpRequest = new HttpEntity<>(body, headers);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(url, httpRequest, Map.class);

            if (response != null) {
                String paymentKey = (String) response.get("paymentKey");
                String approvedAtStr = (String) response.get("approvedAt");
                LocalDateTime approvedAt = approvedAtStr != null
                        ? LocalDateTime.parse(approvedAtStr, DateTimeFormatter.ISO_OFFSET_DATE_TIME)
                        : LocalDateTime.now();

                // 구독 활성화 (30일)
                user.activateProSubscription();
                userRepository.save(user);

                log.info("Billing executed for user: {}, paymentKey: {}, expiresAt: {}",
                        email, paymentKey, user.getSubscriptionExpiresAt());

                return PaymentDto.BillingResponse.builder()
                        .success(true)
                        .message("결제가 완료되었습니다.")
                        .paymentKey(paymentKey)
                        .orderId(orderId)
                        .amount(SUBSCRIPTION_AMOUNT)
                        .approvedAt(approvedAt)
                        .build();
            }

            throw new CustomException(ErrorCode.PAYMENT_FAILED);
        } catch (Exception e) {
            log.error("Failed to execute billing", e);
            throw new CustomException(ErrorCode.PAYMENT_FAILED);
        }
    }

    /**
     * 구독 상태 조회
     */
    public PaymentDto.SubscriptionStatusResponse getSubscriptionStatus(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        return PaymentDto.SubscriptionStatusResponse.builder()
                .subscription(user.getSubscription())
                .expiresAt(user.getSubscriptionExpiresAt())
                .hasBillingKey(user.getBillingKey() != null && !user.getBillingKey().isEmpty())
                .cardInfo(null) // 카드 정보는 별도 조회 필요
                .build();
    }

    /**
     * 구독 취소 (빌링키 삭제)
     */
    @Transactional
    public PaymentDto.CancelResponse cancelSubscription(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        // 빌링키 삭제 (다음 결제 방지)
        user.setBillingKey(null);
        // 구독 상태는 만료일까지 유지
        userRepository.save(user);

        log.info("Subscription cancelled for user: {}. Expires at: {}", email, user.getSubscriptionExpiresAt());

        return PaymentDto.CancelResponse.builder()
                .success(true)
                .message("구독이 취소되었습니다. " +
                        (user.getSubscriptionExpiresAt() != null
                                ? user.getSubscriptionExpiresAt().toLocalDate() + "까지 Pro 기능을 사용할 수 있습니다."
                                : ""))
                .build();
    }

    // ==================== 레거시 호환용 메서드 ====================

    /**
     * 구독 생성 (레거시 - customerKey 반환)
     */
    public PaymentDto.SubscriptionResponse createSubscription(String email, String plan) {
        PaymentDto.CustomerKeyResponse customerKeyResponse = getOrCreateCustomerKey(email);

        return PaymentDto.SubscriptionResponse.builder()
                .orderId("ORDER_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16))
                .customerKey(customerKeyResponse.getCustomerKey())
                .checkoutUrl(null)
                .build();
    }

    /**
     * 결제 검증 및 구독 활성화 (레거시)
     */
    @Transactional
    public void verifyPayment(String email, String paymentKey, String orderId, Integer amount) {
        try {
            String url = tossApiUrl + "/payments/confirm";

            HttpHeaders headers = createAuthHeaders();

            Map<String, Object> body = new HashMap<>();
            body.put("paymentKey", paymentKey);
            body.put("orderId", orderId);
            body.put("amount", amount);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            restTemplate.postForObject(url, request, Map.class);

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

            user.activateProSubscription();
            userRepository.save(user);

            log.info("Payment verified for user: {}, orderId: {}, expires at: {}",
                    email, orderId, user.getSubscriptionExpiresAt());
        } catch (Exception e) {
            log.error("Payment verification failed", e);
            throw new CustomException(ErrorCode.PAYMENT_FAILED);
        }
    }

    // ==================== Private Helper Methods ====================

    private HttpHeaders createAuthHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        String auth = Base64.getEncoder().encodeToString((tossSecretKey + ":").getBytes());
        headers.set("Authorization", "Basic " + auth);
        return headers;
    }
}
