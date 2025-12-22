import apiClient from './client';

// 타입 정의
interface CustomerKeyResponse {
  customerKey: string;
}

interface BillingKeyRequest {
  authKey: string;
  customerKey: string;
}

interface BillingKeyResponse {
  success: boolean;
  message: string;
  billingKey: string;
  customerKey: string;
  cardCompany: string;
  cardNumber: string;
}

interface BillingResponse {
  success: boolean;
  message: string;
  paymentKey: string;
  orderId: string;
  amount: number;
  approvedAt: string;
}

interface SubscriptionStatusResponse {
  subscription: string;
  expiresAt: string | null;
  hasBillingKey: boolean;
  cardInfo: string | null;
}

interface CancelResponse {
  success: boolean;
  message: string;
}

// 레거시 호환용
interface SubscriptionResponse {
  orderId: string;
  checkoutUrl: string;
  customerKey: string;
}

interface PaymentVerifyRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
}

export const paymentApi = {
  // customerKey 조회/생성
  getCustomerKey: async (): Promise<CustomerKeyResponse> => {
    const response = await apiClient.get<CustomerKeyResponse>('/payment/customer-key');
    return response.data;
  },

  // 빌링키 발급
  issueBillingKey: async (data: BillingKeyRequest): Promise<BillingKeyResponse> => {
    const response = await apiClient.post<BillingKeyResponse>('/payment/billing-key', data);
    return response.data;
  },

  // 정기 결제 실행
  executeBilling: async (): Promise<BillingResponse> => {
    const response = await apiClient.post<BillingResponse>('/payment/billing/execute');
    return response.data;
  },

  // 구독 상태 조회
  getSubscriptionStatus: async (): Promise<SubscriptionStatusResponse> => {
    const response = await apiClient.get<SubscriptionStatusResponse>('/payment/subscription/status');
    return response.data;
  },

  // 구독 취소
  cancelSubscription: async (): Promise<CancelResponse> => {
    const response = await apiClient.post<CancelResponse>('/payment/subscription/cancel');
    return response.data;
  },

  // ==================== 레거시 호환용 ====================

  createSubscription: async (plan: string): Promise<SubscriptionResponse> => {
    const response = await apiClient.post<SubscriptionResponse>('/payment/subscription', {
      plan,
    });
    return response.data;
  },

  verifyPayment: async (data: PaymentVerifyRequest): Promise<void> => {
    await apiClient.post('/payment/verify', data);
  },

  getPaymentHistory: async (): Promise<unknown[]> => {
    const response = await apiClient.get<unknown[]>('/payment/history');
    return response.data;
  },
};
