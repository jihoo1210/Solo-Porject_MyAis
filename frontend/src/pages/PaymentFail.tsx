import { useSearchParams, Link } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function PaymentFail() {
  const [searchParams] = useSearchParams();
  const errorCode = searchParams.get('code');
  const errorMessage = searchParams.get('message');

  const getErrorDescription = (code: string | null) => {
    switch (code) {
      case 'PAY_PROCESS_CANCELED':
        return '결제가 취소되었습니다.';
      case 'PAY_PROCESS_ABORTED':
        return '결제가 중단되었습니다.';
      case 'REJECT_CARD_COMPANY':
        return '카드사에서 결제를 거절했습니다.';
      case 'INVALID_CARD_EXPIRATION':
        return '카드 유효기간이 올바르지 않습니다.';
      case 'INVALID_STOPPED_CARD':
        return '정지된 카드입니다.';
      case 'EXCEED_MAX_DAILY_PAYMENT_COUNT':
        return '일일 결제 한도를 초과했습니다.';
      case 'EXCEED_MAX_PAYMENT_AMOUNT':
        return '결제 금액 한도를 초과했습니다.';
      default:
        return errorMessage || '결제 처리 중 오류가 발생했습니다.';
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md w-full">
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8 sm:w-10 sm:h-10 text-red-400" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
          결제에 실패했습니다
        </h1>
        <p className="text-sm sm:text-base text-gray-400 mb-6">
          {getErrorDescription(errorCode)}
        </p>

        {errorCode && (
          <div className="bg-white/5 rounded-xl border border-gray-700/20 p-3 sm:p-4 mb-6 text-left backdrop-blur-sm">
            <div className="text-xs sm:text-sm text-gray-500 mb-1">오류 코드</div>
            <div className="font-mono text-xs sm:text-sm text-gray-300">{errorCode}</div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/payment"
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm sm:text-base"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            다시 시도
          </Link>
          <Link
            to="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-white/5 border border-gray-700/30 text-gray-300 hover:bg-white/10 rounded-lg transition-colors text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            대시보드로 이동
          </Link>
        </div>

        <p className="text-xs sm:text-sm text-gray-500 mt-6 sm:mt-8">
          문제가 계속되면{' '}
          <a href="mailto:support@myais.com" className="text-primary-400 hover:underline">
            고객센터
          </a>
          로 문의해주세요.
        </p>
      </div>
    </div>
  );
}
