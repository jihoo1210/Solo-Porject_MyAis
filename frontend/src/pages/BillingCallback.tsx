import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { paymentApi } from '../api';
import { useAuthStore } from '../store';

type CallbackType = 'success' | 'fail';

interface BillingCallbackProps {
  type: CallbackType;
}

export default function BillingCallback({ type }: BillingCallbackProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuthStore();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (type === 'success') {
      handleSuccess();
    } else {
      handleFail();
    }
  }, [type]);

  const handleSuccess = async () => {
    const authKey = searchParams.get('authKey');
    const customerKey = searchParams.get('customerKey');

    if (!authKey || !customerKey) {
      setStatus('error');
      setMessage('필수 정보가 누락되었습니다.');
      return;
    }

    try {
      // 백엔드로 빌링키 발급 요청
      const billingKeyResponse = await paymentApi.issueBillingKey({
        authKey,
        customerKey,
      });

      if (billingKeyResponse.success) {
        // 첫 결제 실행
        const billingResponse = await paymentApi.executeBilling();

        if (billingResponse.success) {
          setStatus('success');
          setMessage('Pro 구독이 완료되었습니다!');
          refreshUser?.();

          // 3초 후 대시보드로 이동
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(billingResponse.message || '결제에 실패했습니다.');
        }
      } else {
        setStatus('error');
        setMessage(billingKeyResponse.message || '카드 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('Billing process failed:', error);
      setStatus('error');
      setMessage('결제 처리 중 오류가 발생했습니다.');
    }
  };

  const handleFail = () => {
    const errorCode = searchParams.get('code');
    const errorMessage = searchParams.get('message');

    setStatus('error');
    setMessage(errorMessage || `결제가 실패했습니다. (${errorCode})`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="max-w-md w-full text-center">
        {status === 'processing' && (
          <>
            <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-primary-400 animate-spin mx-auto mb-4" />
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">결제 처리 중...</h1>
            <p className="text-sm sm:text-base text-gray-400">잠시만 기다려주세요.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-400 mx-auto mb-4" />
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">구독 완료!</h1>
            <p className="text-sm sm:text-base text-gray-400 mb-6">{message}</p>
            <p className="text-xs sm:text-sm text-gray-500">잠시 후 대시보드로 이동합니다...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">결제 실패</h1>
            <p className="text-sm sm:text-base text-gray-400 mb-6">{message}</p>
            <button
              onClick={() => navigate('/payment')}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm sm:text-base"
            >
              다시 시도하기
            </button>
          </>
        )}
      </div>
    </div>
  );
}
