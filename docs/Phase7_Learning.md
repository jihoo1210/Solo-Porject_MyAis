# Phase 7: 결제 시스템 학습 문서

## 📋 개요
Phase 7에서는 TossPayments 결제 통합과 구독 관리 기능을 확인했습니다. 설정 페이지에서 구독 상태를 관리할 수 있습니다.

## 🏗️ Settings 페이지 구조

```
Settings
├── Sidebar Navigation
│   ├── Profile
│   ├── Password
│   ├── Subscription
│   └── Notifications
├── Tab Content
│   ├── Profile Form
│   ├── Password Change Form
│   ├── Subscription Management
│   └── Notification Preferences
└── Danger Zone (Account Deletion)
```

## 🔧 결제 관련 API

### 백엔드 PaymentService
```java
public PaymentDto.SubscriptionResponse createSubscription(String email, String plan) {
    String orderId = "ORDER_" + UUID.randomUUID();
    return PaymentDto.SubscriptionResponse.builder()
            .orderId(orderId)
            .checkoutUrl(null)  // 클라이언트에서 TossPayments SDK 사용
            .build();
}

public void verifyPayment(String email, String paymentKey, String orderId, Integer amount) {
    // TossPayments API로 결제 검증
    HttpHeaders headers = new HttpHeaders();
    headers.set("Authorization", "Basic " + Base64.encode(tossSecretKey + ":"));

    restTemplate.postForObject(tossApiUrl + "/payments/confirm", request, Map.class);

    // 사용자 구독 상태 업데이트
    user.setSubscription("PRO");
    userRepository.save(user);
}
```

### 프론트엔드 결제 API
```typescript
export const paymentApi = {
  createSubscription: async (plan: string) => {
    const response = await apiClient.post('/v1/payment/subscription', { plan });
    return response.data;
  },

  verifyPayment: async (data: PaymentVerifyRequest) => {
    await apiClient.post('/v1/payment/verify', data);
  },

  cancelSubscription: async () => {
    await apiClient.post('/v1/payment/cancel');
  },
};
```

## 🔧 구독 관리 UI

### 현재 플랜 표시
```typescript
<div className="bg-gray-50 rounded-xl p-4">
  <div className="flex items-center justify-between">
    <div>
      <div className="text-sm text-gray-500">현재 플랜</div>
      <div className="text-xl font-semibold">
        {user?.subscription === 'PRO' ? 'Pro' : 'Free'}
      </div>
    </div>
    {user?.subscription === 'PRO' && (
      <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full">
        활성
      </span>
    )}
  </div>
</div>
```

### 구독 취소
```typescript
const handleCancelSubscription = async () => {
  if (!confirm('정말로 구독을 취소하시겠습니까?')) return;

  await paymentApi.cancelSubscription();
  const updatedUser = await authApi.me();
  setUser(updatedUser);
};
```

## 🔧 요금제 정보

### FREE 플랜
- AI 3개 생성
- 일 20회 실행
- GPT-4o-mini
- 7일 히스토리

### PRO 플랜 (₩9,900/월)
- 무제한 AI 생성
- 무제한 실행
- GPT-4o 사용 가능
- 이미지 분석
- 무제한 히스토리
- 우선 처리

## ✅ Phase 7 완료 항목

- [x] PaymentService 백엔드 구현
- [x] TossPayments API 통합
- [x] 구독 생성/검증/취소 API
- [x] Settings 페이지 구독 탭
- [x] 요금제 표시 및 업그레이드 링크

---
작성일: 2024-12-18
