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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">결제를 확인하고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            결제 확인 실패
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => navigate('/payment')}
              className="btn-secondary"
            >
              다시 시도
            </button>
            <Link to="/dashboard" className="btn-primary">
              대시보드로 이동
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          결제가 완료되었습니다! 🎉
        </h1>
        <p className="text-gray-600 mb-6">
          Pro 플랜이 활성화되었습니다. 이제 모든 기능을 이용할 수 있습니다.
        </p>
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="text-sm text-gray-600 mb-1">구독 플랜</div>
          <div className="text-lg font-semibold text-primary-600">
            MyAIs Pro
          </div>
          <div className="text-sm text-gray-500">₩9,900/월</div>
        </div>
        <Link to="/dashboard" className="btn-primary w-full justify-center">
          대시보드로 이동
        </Link>
      </div>
    </div>
  );
}
