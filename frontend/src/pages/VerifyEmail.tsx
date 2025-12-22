import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Mail, Sparkles } from 'lucide-react';
import { authApi } from '../api';
import NeuralNetwork from '../components/three/NeuralNetwork';

type VerificationStatus = 'loading' | 'success' | 'error' | 'expired' | 'used';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('인증 토큰이 없습니다.');
      return;
    }

    const verifyEmail = async () => {
      try {
        await authApi.verifyEmail(token);
        setStatus('success');
      } catch (err: any) {
        const code = err.response?.data?.code;
        if (code === 'A007') {
          setStatus('expired');
          setErrorMessage('인증 링크가 만료되었습니다.');
        } else if (code === 'A008') {
          setStatus('used');
          setErrorMessage('이미 사용된 인증 링크입니다.');
        } else if (code === 'A010') {
          setStatus('success'); // 이미 인증됨
        } else {
          setStatus('error');
          setErrorMessage(err.response?.data?.message || '이메일 인증에 실패했습니다.');
        }
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen relative bg-gray-950">
      {/* Three.js Background */}
      <div className="fixed inset-0 z-0">
        <NeuralNetwork opacity={0.4} particleCount={2000} />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-gray-950/30 to-gray-950/50 z-10" />

      {/* Content */}
      <div className="relative z-20 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-white">
              <Sparkles className="w-8 h-8 text-primary-400" />
              <span className="text-2xl font-bold">MyAIs</span>
            </Link>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-800/50 p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary-500/20 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">이메일 인증 중...</h1>
              <p className="text-gray-400">잠시만 기다려주세요.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">이메일 인증 완료!</h1>
              <p className="text-gray-400 mb-6">
                이메일 인증이 성공적으로 완료되었습니다.<br />
                이제 모든 기능을 사용할 수 있습니다.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
              >
                로그인하기
              </Link>
            </>
          )}

          {(status === 'error' || status === 'expired' || status === 'used') && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">인증 실패</h1>
              <p className="text-gray-400 mb-6">{errorMessage}</p>

              {status === 'expired' && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">
                    인증 링크가 만료되었습니다. 새로운 인증 이메일을 요청해주세요.
                  </p>
                  <Link
                    to="/resend-verification"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    인증 이메일 재발송
                  </Link>
                </div>
              )}

              {status === 'used' && (
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
                >
                  로그인하기
                </Link>
              )}

              {status === 'error' && (
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                >
                  회원가입으로 돌아가기
                </Link>
              )}
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
