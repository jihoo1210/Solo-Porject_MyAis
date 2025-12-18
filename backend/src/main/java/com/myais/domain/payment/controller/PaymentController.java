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
    public ResponseEntity<Void> cancelSubscription(
            @AuthenticationPrincipal UserDetails userDetails) {
        paymentService.cancelSubscription(userDetails.getUsername());
        return ResponseEntity.ok().build();
    }
}
