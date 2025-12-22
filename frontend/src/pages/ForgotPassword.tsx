import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyRound, Loader2, CheckCircle, ArrowLeft, Sparkles } from 'lucide-react';
import { authApi } from '../api';
import NeuralNetwork from '../components/three/NeuralNetwork';

const forgotPasswordSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다.'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setError('');
      await authApi.forgotPassword(data.email);
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || '요청 처리에 실패했습니다.');
    }
  };

  if (isSubmitted) {
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
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">이메일 발송 완료</h1>
              <p className="text-gray-400 mb-6">
                입력하신 이메일 주소로<br />
                비밀번호 재설정 링크를 보내드렸습니다.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                이메일이 도착하지 않았다면 스팸함을 확인하거나,<br />
                입력한 이메일 주소가 맞는지 확인해주세요.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
              >
                로그인으로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

          <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-800/50 p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary-500/20 flex items-center justify-center">
                <KeyRound className="w-8 h-8 text-primary-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">비밀번호 찾기</h1>
              <p className="text-gray-400">
                가입하신 이메일 주소를 입력하시면<br />
                비밀번호 재설정 링크를 보내드립니다.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  이메일
                </label>
                <input
                  type="email"
                  {...register('email')}
                  className="w-full px-4 py-3 bg-white/5 border border-gray-700/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent backdrop-blur-sm"
                  placeholder="name@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 text-white font-medium rounded-lg transition-colors"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                재설정 링크 발송
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-300"
              >
                <ArrowLeft className="w-4 h-4" />
                로그인으로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
