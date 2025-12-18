package com.myais.domain.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class PaymentDto {

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
