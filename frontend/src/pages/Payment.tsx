import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, Crown, Loader2, CreditCard } from 'lucide-react';
import { useAuthStore } from '../store';
import { paymentApi } from '../api';

const PLANS = [
  {
    id: 'FREE',
    name: 'Free',
    price: 0,
    period: '무료',
    icon: Zap,
    features: [
      'AI 도구 3개 생성',
      '일 20회 실행',
      'Gemini 2.5 Flash Lite 모델',
      '이미지 분석 기능',
      'URL 크롤링',
    ],
    limitations: ['고급 모델 사용 불가'],
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: 9900,
    period: '월',
    icon: Crown,
    features: [
      'AI 도구 무제한 생성',
      '무제한 실행',
      'Gemini 2.5 Flash 모델',
      'Gemini 2.5 Pro 사용 가능',
      'Nano Banana (Gemini 3 Preview)',
      '이미지 분석 기능',
      'URL 크롤링',
    ],
    limitations: [],
    recommended: true,
  },
];

export default function Payment() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentPlan = user?.subscription || 'FREE';

  const handleSubscribe = async (planId: string) => {
    if (planId === 'FREE') {
      navigate('/dashboard');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. customerKey 가져오기
      const customerKeyResponse = await paymentApi.getCustomerKey();
      const customerKey = customerKeyResponse.customerKey;

      // 2. TossPayments SDK 확인
      if (typeof window.TossPayments === 'undefined') {
        throw new Error('결제 모듈을 불러오는데 실패했습니다. 페이지를 새로고침해주세요.');
      }

      // 3. 클라이언트 키
      const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY;

      // 4. TossPayments 인스턴스 생성 및 빌링키 발급 요청
      const tossPayments = window.TossPayments(clientKey);
      const payment = tossPayments.payment({ customerKey });

      // 플랜 정보 저장 (성공 페이지에서 사용)
      localStorage.setItem('selectedPlan', JSON.stringify({
        id: 'PRO',
        price: 9900,
        name: 'Pro 월간 구독',
      }));

      await payment.requestBillingAuth({
        method: 'CARD',
        customerEmail: user?.email,
        customerName: user?.name,
        successUrl: `${window.location.origin}/payment/billing-success`,
        failUrl: `${window.location.origin}/payment/billing-fail`,
      });
    } catch (err) {
      console.error('Payment initiation failed:', err);
      const errorMessage = err instanceof Error ? err.message : '결제 처리 중 오류가 발생했습니다.';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="text-center mb-8 sm:mb-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">요금제 선택</h1>
        <p className="text-sm sm:text-base text-gray-400">
          Pro 플랜으로 업그레이드하여 모든 기능을 이용하세요
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 mb-6">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {PLANS.map((plan) => {
          const isCurrentPlan = currentPlan === plan.id;
          const isPro = plan.id === 'PRO';

          return (
            <div
              key={plan.id}
              className={`relative rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col ${
                isPro
                  ? 'bg-gradient-to-b from-indigo-600 to-purple-700 ring-2 ring-indigo-400 shadow-lg shadow-indigo-500/25'
                  : 'bg-gray-800 border border-gray-700'
              }`}
            >
              {plan.recommended && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-semibold px-2 sm:px-3 py-1 rounded-full">
                  인기
                </span>
              )}

              {isCurrentPlan && (
                <span className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-green-900/50 text-green-400 text-xs font-medium px-2 py-1 rounded-full">
                  현재 플랜
                </span>
              )}

              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">{plan.name}</h2>
              <div className="mb-4 sm:mb-6">
                <span className="text-3xl sm:text-4xl font-bold text-white">
                  {plan.price === 0 ? '₩0' : `₩${plan.price.toLocaleString()}`}
                </span>
                {plan.price > 0 && (
                  <span className="text-sm sm:text-base text-gray-300">/{plan.period}</span>
                )}
              </div>

              <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-xs sm:text-sm">
                    <Check className="w-4 h-4 text-green-400 shrink-0" />
                    <span className="text-white">{feature}</span>
                  </li>
                ))}
                {plan.limitations.map((limitation) => (
                  <li
                    key={limitation}
                    className="flex items-center gap-2 text-xs sm:text-sm text-gray-400"
                  >
                    <span className="w-4 h-4 flex items-center justify-center">×</span>
                    <span>{limitation}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={isLoading || isCurrentPlan}
                className={`w-full py-2.5 sm:py-3 text-center font-semibold rounded-lg sm:rounded-xl transition-all text-sm sm:text-base flex items-center justify-center gap-2 ${
                  isCurrentPlan
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : isPro
                      ? 'bg-white text-indigo-600 hover:bg-gray-100'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {isLoading && isPro ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    처리 중...
                  </>
                ) : isCurrentPlan ? (
                  '현재 이용 중'
                ) : isPro ? (
                  <>
                    <CreditCard className="w-4 h-4" />
                    ₩9,900/월 구독하기
                  </>
                ) : (
                  '무료로 시작하기'
                )}
              </button>

              {isPro && !isCurrentPlan && (
                <p className="text-xs text-gray-300/80 text-center mt-2">
                  언제든지 취소 가능 · 매월 자동 결제
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="mt-12 sm:mt-16">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 text-center">
          자주 묻는 질문
        </h2>
        <div className="space-y-3 sm:space-y-4">
          <div className="bg-white/5 rounded-lg sm:rounded-xl border border-gray-700/20 p-3 sm:p-4 backdrop-blur-sm">
            <h3 className="font-medium text-white mb-1 sm:mb-2 text-sm sm:text-base">
              정기 결제는 어떻게 진행되나요?
            </h3>
            <p className="text-gray-400 text-xs sm:text-sm">
              카드 정보를 등록하면 매월 자동으로 결제됩니다. 토스페이먼츠를 통해 안전하게 처리됩니다.
            </p>
          </div>
          <div className="bg-white/5 rounded-lg sm:rounded-xl border border-gray-700/20 p-3 sm:p-4 backdrop-blur-sm">
            <h3 className="font-medium text-white mb-1 sm:mb-2 text-sm sm:text-base">
              구독을 취소하면 어떻게 되나요?
            </h3>
            <p className="text-gray-400 text-xs sm:text-sm">
              구독을 취소해도 결제 기간까지는 Pro 기능을 계속 이용할 수 있습니다.
              기간 만료 후 Free 플랜으로 전환됩니다.
            </p>
          </div>
          <div className="bg-white/5 rounded-lg sm:rounded-xl border border-gray-700/20 p-3 sm:p-4 backdrop-blur-sm">
            <h3 className="font-medium text-white mb-1 sm:mb-2 text-sm sm:text-base">
              환불이 가능한가요?
            </h3>
            <p className="text-gray-400 text-xs sm:text-sm">
              결제 후 7일 이내에 서비스를 전혀 이용하지 않은 경우 전액 환불이
              가능합니다. 고객센터로 문의해주세요.
            </p>
          </div>
        </div>
      </div>

      <p className="text-center text-gray-500 text-xs sm:text-sm mt-6 sm:mt-8">
        TossPayments 안전 결제 · 언제든지 취소 가능
      </p>
    </div>
  );
}

// TossPayments SDK v2 type declarations
interface TossPaymentInstance {
  requestBillingAuth: (options: {
    method: 'CARD';
    customerEmail?: string;
    customerName?: string;
    successUrl: string;
    failUrl: string;
  }) => Promise<void>;
}

interface TossPayments {
  payment: (options: { customerKey: string }) => TossPaymentInstance;
}

declare global {
  interface Window {
    TossPayments: (clientKey: string) => TossPayments;
  }
}
