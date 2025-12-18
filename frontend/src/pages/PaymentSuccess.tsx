import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import { paymentApi } from '../api';
import { useAuthStore } from '../store';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuthStore();
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');

    if (!paymentKey || !orderId || !amount) {
      setError('결제 정보가 올바르지 않습니다');
      setIsVerifying(false);
      return;
    }

    try {
      await paymentApi.verifyPayment({
        paymentKey,
        orderId,
        amount: Number(amount),
      });

      // Refresh user data to update subscription status
      await refreshUser();
      setIsVerifying(false);
    } catch (err) {
      console.error('Payment verification failed:', err);
      setError('결제 확인 중 오류가 발생했습니다');
      setIsVerifying(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-sm sm:text-base text-gray-400">결제를 확인하고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md w-full">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl sm:text-4xl">❌</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
            결제 확인 실패
          </h1>
          <p className="text-sm sm:text-base text-gray-400 mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => navigate('/payment')}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-white/5 border border-gray-700/30 text-gray-300 hover:bg-white/10 transition-colors text-sm sm:text-base"
            >
              다시 시도
            </button>
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm sm:text-base text-center"
            >
              대시보드로 이동
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md w-full">
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-400" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
          결제가 완료되었습니다!
        </h1>
        <p className="text-sm sm:text-base text-gray-400 mb-6">
          Pro 플랜이 활성화되었습니다. 이제 모든 기능을 이용할 수 있습니다.
        </p>
        <div className="bg-white/5 rounded-xl border border-gray-700/20 p-3 sm:p-4 mb-6 backdrop-blur-sm">
          <div className="text-xs sm:text-sm text-gray-400 mb-1">구독 플랜</div>
          <div className="text-base sm:text-lg font-semibold text-primary-400">
            MyAIs Pro
          </div>
          <div className="text-xs sm:text-sm text-gray-500">₩9,900/월</div>
        </div>
        <Link
          to="/dashboard"
          className="inline-block w-full px-4 py-2.5 sm:py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors text-center text-sm sm:text-base"
        >
          대시보드로 이동
        </Link>
      </div>
    </div>
  );
}
