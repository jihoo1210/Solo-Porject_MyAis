import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyRound, Loader2, CheckCircle, XCircle, Eye, EyeOff, Sparkles } from 'lucide-react';
import { authApi } from '../api';
import NeuralNetwork from '../components/three/NeuralNetwork';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, '비밀번호는 8자 이상이어야 합니다.')
      .regex(
        /^(?=.*[a-zA-Z])(?=.*\d)/,
        '비밀번호는 영문과 숫자를 포함해야 합니다.'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

type PageStatus = 'loading' | 'valid' | 'invalid' | 'success';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<PageStatus>('loading');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      setError('재설정 토큰이 없습니다.');
      return;
    }

    const validateToken = async () => {
      try {
        const isValid = await authApi.validateResetToken(token);
        setStatus(isValid ? 'valid' : 'invalid');
        if (!isValid) {
          setError('유효하지 않거나 만료된 링크입니다.');
        }
      } catch {
        setStatus('invalid');
        setError('토큰 검증에 실패했습니다.');
      }
    };

    validateToken();
  }, [token]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;

    try {
      setError('');
      await authApi.resetPassword(token, data.password);
      setStatus('success');
    } catch (err: any) {
      const code = err.response?.data?.code;
      if (code === 'A007') {
        setError('재설정 링크가 만료되었습니다. 다시 요청해주세요.');
      } else if (code === 'A008') {
        setError('이미 사용된 재설정 링크입니다.');
      } else {
        setError(err.response?.data?.message || '비밀번호 재설정에 실패했습니다.');
      }
    }
  };

  // 로딩 상태
  if (status === 'loading') {
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
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary-500/20 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">링크 확인 중...</h1>
              <p className="text-gray-400">잠시만 기다려주세요.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 유효하지 않은 토큰
  if (status === 'invalid') {
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
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">링크 오류</h1>
              <p className="text-gray-400 mb-6">{error}</p>
              <Link
                to="/forgot-password"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
              >
                비밀번호 찾기로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 재설정 성공
  if (status === 'success') {
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
              <h1 className="text-2xl font-bold text-white mb-2">비밀번호 변경 완료</h1>
              <p className="text-gray-400 mb-6">
                비밀번호가 성공적으로 변경되었습니다.<br />
                새 비밀번호로 로그인해주세요.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
              >
                로그인하기
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 비밀번호 재설정 폼
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
              <h1 className="text-2xl font-bold text-white mb-2">새 비밀번호 설정</h1>
              <p className="text-gray-400">
                새로운 비밀번호를 입력해주세요.
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
                  새 비밀번호
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    className="w-full px-4 py-3 bg-white/5 border border-gray-700/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-10 backdrop-blur-sm"
                    placeholder="8자 이상, 영문 + 숫자"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  새 비밀번호 확인
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirmPassword')}
                    className="w-full px-4 py-3 bg-white/5 border border-gray-700/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-10 backdrop-blur-sm"
                    placeholder="비밀번호를 다시 입력하세요"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-400">{errors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-600/50 text-white font-medium rounded-lg transition-colors"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                비밀번호 변경
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
