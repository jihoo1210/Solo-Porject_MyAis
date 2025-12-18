import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, Crown, Loader2 } from 'lucide-react';
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
      '기본 AI 모델',
      '기본 지원',
    ],
    limitations: [
      '고급 기능 제한',
      '우선 지원 없음',
    ],
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
      'GPT-4 접근',
      '이미지 분석 기능',
      'URL 크롤링',
      '우선 지원',
      '커스텀 API 키 사용',
    ],
    limitations: [],
    recommended: true,
  },
];

export default function Payment() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = useState<string>('PRO');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    if (selectedPlan === 'FREE') {
      navigate('/dashboard');
      return;
    }

    setIsLoading(true);
    try {
      const response = await paymentApi.createSubscription(selectedPlan);

      // TossPayments SDK 호출
      if (window.TossPayments) {
        const tossPayments = window.TossPayments(
          import.meta.env.VITE_TOSS_CLIENT_KEY
        );

        await tossPayments.requestPayment('카드', {
          amount: 9900,
          orderId: response.orderId,
          orderName: 'MyAIs Pro 구독',
          customerName: user?.name,
          successUrl: `${window.location.origin}/payment/success`,
          failUrl: `${window.location.origin}/payment/fail`,
        });
      } else {
        // Fallback: Direct API call
        window.location.href = response.checkoutUrl;
      }
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentPlan = user?.subscription || 'FREE';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="text-center mb-8 sm:mb-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">요금제 선택</h1>
        <p className="text-sm sm:text-base text-gray-400">
          Pro 플랜으로 업그레이드하여 모든 기능을 이용하세요
        </p>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {PLANS.map((plan) => {
          const isCurrentPlan = currentPlan === plan.id;
          const isSelected = selectedPlan === plan.id;

          return (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative rounded-xl sm:rounded-2xl p-4 sm:p-6 text-left transition-all flex flex-col ${
                isSelected
                  ? plan.id === 'PRO'
                    ? 'bg-gradient-to-b from-indigo-600 to-purple-700 ring-2 ring-indigo-400 shadow-lg shadow-indigo-500/25'
                    : 'bg-gray-800 ring-2 ring-primary-500'
                  : plan.id === 'PRO'
                    ? 'bg-gradient-to-b from-indigo-600/80 to-purple-700/80 hover:from-indigo-600 hover:to-purple-700'
                    : 'bg-gray-800 border border-gray-700 hover:border-gray-600'
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
                  {plan.price === 0
                    ? '₩0'
                    : `₩${plan.price.toLocaleString()}`}
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
                    <span className="w-4 h-4 flex items-center justify-center">
                      ×
                    </span>
                    <span>{limitation}</span>
                  </li>
                ))}
              </ul>

              <div
                className={`w-full py-2.5 sm:py-3 text-center font-semibold rounded-lg sm:rounded-xl transition-all text-sm sm:text-base ${
                  plan.id === 'PRO'
                    ? 'bg-white text-indigo-600 hover:bg-gray-100'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {plan.id === 'FREE' ? '시작하기' : '구독하기'}
              </div>
            </button>
          );
        })}
      </div>

      {/* Subscribe Button */}
      <div className="text-center">
        <button
          onClick={handleSubscribe}
          disabled={isLoading || currentPlan === selectedPlan}
          className="inline-flex items-center px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-lg bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700 disabled:text-gray-400 text-white rounded-lg sm:rounded-xl font-semibold transition-all w-full sm:w-auto justify-center"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
              처리 중...
            </>
          ) : currentPlan === selectedPlan ? (
            '현재 이용 중인 플랜입니다'
          ) : selectedPlan === 'FREE' ? (
            'Free 플랜으로 시작하기'
          ) : (
            `Pro 플랜 구독하기 (₩9,900/월)`
          )}
        </button>

        {selectedPlan === 'PRO' && (
          <p className="text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4">
            언제든지 취소할 수 있습니다. 취소 후에도 결제 기간까지 이용 가능합니다.
          </p>
        )}
      </div>

      {/* FAQ */}
      <div className="mt-12 sm:mt-16">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 text-center">
          자주 묻는 질문
        </h2>
        <div className="space-y-3 sm:space-y-4">
          <div className="bg-white/5 rounded-lg sm:rounded-xl border border-gray-700/20 p-3 sm:p-4 backdrop-blur-sm">
            <h3 className="font-medium text-white mb-1 sm:mb-2 text-sm sm:text-base">
              결제는 어떻게 진행되나요?
            </h3>
            <p className="text-gray-400 text-xs sm:text-sm">
              토스페이먼츠를 통해 안전하게 결제됩니다. 신용카드, 체크카드를 사용할
              수 있습니다.
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

// TossPayments SDK type declaration
declare global {
  interface Window {
    TossPayments: (clientKey: string) => {
      requestPayment: (
        method: string,
        options: {
          amount: number;
          orderId: string;
          orderName: string;
          customerName?: string;
          successUrl: string;
          failUrl: string;
        }
      ) => Promise<void>;
    };
  }
}
