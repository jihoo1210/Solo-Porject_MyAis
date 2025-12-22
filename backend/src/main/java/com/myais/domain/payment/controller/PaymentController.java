package com.myais.domain.payment.controller;

import com.myais.domain.payment.dto.PaymentDto;
import com.myais.domain.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * customerKey 조회 또는 생성
     * 빌링키 발급 전에 호출하여 customerKey를 받아야 함
     */
    @GetMapping("/customer-key")
    public ResponseEntity<PaymentDto.CustomerKeyResponse> getCustomerKey(
            @AuthenticationPrincipal UserDetails userDetails) {
        PaymentDto.CustomerKeyResponse response = paymentService.getOrCreateCustomerKey(
                userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    /**
     * 빌링키 발급
     * 프론트엔드에서 SDK로 카드 정보 입력 후 받은 authKey로 빌링키 발급
     */
    @PostMapping("/billing-key")
    public ResponseEntity<PaymentDto.BillingKeyResponse> issueBillingKey(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody PaymentDto.BillingKeyRequest request) {
        PaymentDto.BillingKeyResponse response = paymentService.issueBillingKey(
                userDetails.getUsername(), request);
        return ResponseEntity.ok(response);
    }

    /**
     * 정기 결제 실행
     * 빌링키가 등록된 사용자에 대해 결제 실행
     */
    @PostMapping("/billing/execute")
    public ResponseEntity<PaymentDto.BillingResponse> executeBilling(
            @AuthenticationPrincipal UserDetails userDetails) {
        PaymentDto.BillingResponse response = paymentService.executeBilling(
                userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    /**
     * 구독 상태 조회
     */
    @GetMapping("/subscription/status")
    public ResponseEntity<PaymentDto.SubscriptionStatusResponse> getSubscriptionStatus(
            @AuthenticationPrincipal UserDetails userDetails) {
        PaymentDto.SubscriptionStatusResponse response = paymentService.getSubscriptionStatus(
                userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    /**
     * 구독 취소
     */
    @PostMapping("/subscription/cancel")
    public ResponseEntity<PaymentDto.CancelResponse> cancelSubscription(
            @AuthenticationPrincipal UserDetails userDetails) {
        PaymentDto.CancelResponse response = paymentService.cancelSubscription(
                userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    // ==================== 레거시 호환용 엔드포인트 ====================

    @PostMapping("/subscription")
    public ResponseEntity<PaymentDto.SubscriptionResponse> createSubscription(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody PaymentDto.SubscriptionRequest request) {
        PaymentDto.SubscriptionResponse response = paymentService.createSubscription(
                userDetails.getUsername(), request.getPlan());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify")
    public ResponseEntity<Void> verifyPayment(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody PaymentDto.VerifyRequest request) {
        paymentService.verifyPayment(
                userDetails.getUsername(),
                request.getPaymentKey(),
                request.getOrderId(),
                request.getAmount());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/cancel")
    public ResponseEntity<PaymentDto.CancelResponse> cancelSubscriptionLegacy(
            @AuthenticationPrincipal UserDetails userDetails) {
        PaymentDto.CancelResponse response = paymentService.cancelSubscription(
                userDetails.getUsername());
        return ResponseEntity.ok(response);
    }
}
