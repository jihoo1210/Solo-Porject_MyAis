package com.myais.domain.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class PaymentDto {

    // 빌링키 발급 요청 (프론트에서 authKey 전달)
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BillingKeyRequest {
        private String authKey;       // SDK에서 받은 인증키
        private String customerKey;   // 고객 고유 식별자
    }

    // 빌링키 발급 응답
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BillingKeyResponse {
        private boolean success;
        private String message;
        private String billingKey;
        private String customerKey;
        private String cardCompany;
        private String cardNumber;
    }

    // 정기 결제 실행 요청
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BillingRequest {
        private Integer amount;
        private String orderName;
    }

    // 정기 결제 실행 응답
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BillingResponse {
        private boolean success;
        private String message;
        private String paymentKey;
        private String orderId;
        private Integer amount;
        private LocalDateTime approvedAt;
    }

    // 구독 상태 응답
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubscriptionStatusResponse {
        private String subscription;
        private LocalDateTime expiresAt;
        private boolean hasBillingKey;
        private String cardInfo;
    }

    // customerKey 생성 요청
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CustomerKeyResponse {
        private String customerKey;
    }

    // 구독 취소 응답
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CancelResponse {
        private boolean success;
        private String message;
    }

    // 레거시 호환용 (기존 코드 호환)
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubscriptionRequest {
        private String plan;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubscriptionResponse {
        private String orderId;
        private String checkoutUrl;
        private String customerKey;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VerifyRequest {
        private String paymentKey;
        private String orderId;
        private Integer amount;
    }
}
