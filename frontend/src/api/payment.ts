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
    const response = await apiClient.post<SubscriptionResponse>('/payment/subscription', {
      plan,
    });
    return response.data;
  },

  verifyPayment: async (data: PaymentVerifyRequest): Promise<void> => {
    await apiClient.post('/payment/verify', data);
  },

  cancelSubscription: async (): Promise<void> => {
    await apiClient.post('/payment/cancel');
  },

  getPaymentHistory: async (): Promise<unknown[]> => {
    const response = await apiClient.get<unknown[]>('/payment/history');
    return response.data;
  },
};
