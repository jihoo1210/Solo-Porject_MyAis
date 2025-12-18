import apiClient from './client';

interface SubscriptionResponse {
  orderId: string;
  checkoutUrl: string;
}

interface PaymentVerifyRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
}

export const paymentApi = {
  createSubscription: async (plan: string): Promise<SubscriptionResponse> => {
    const response = await apiClient.post<SubscriptionResponse>('/v1/payment/subscription', {
      plan,
    });
    return response.data;
  },

  verifyPayment: async (data: PaymentVerifyRequest): Promise<void> => {
    await apiClient.post('/v1/payment/verify', data);
  },

  cancelSubscription: async (): Promise<void> => {
    await apiClient.post('/v1/payment/cancel');
  },

  getPaymentHistory: async (): Promise<unknown[]> => {
    const response = await apiClient.get<unknown[]>('/v1/payment/history');
    return response.data;
  },
};
