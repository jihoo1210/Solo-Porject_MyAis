import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore, useUIStore } from '../store';
import { Loader2 } from 'lucide-react';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { theme } = useUIStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError('로그인 중 오류가 발생했습니다.');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    if (!token) {
      setError('인증 토큰이 없습니다.');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/v1/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user info');
        }

        const apiResponse = await response.json();

        if (!apiResponse.success || !apiResponse.data) {
          throw new Error('Invalid API response');
        }

        const userData = apiResponse.data;

        setAuth({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          avatarUrl: userData.avatarUrl,
          provider: userData.provider,
          emailVerified: userData.emailVerified,
          subscription: userData.subscription || 'FREE',
          dailyUsageCount: userData.dailyUsageCount,
          createdAt: userData.createdAt || new Date().toISOString(),
          updatedAt: userData.updatedAt || new Date().toISOString(),
        }, token, refreshToken || undefined);

        navigate('/dashboard');
      } catch {
        setError('사용자 정보를 가져오는데 실패했습니다.');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    fetchUserInfo();
  }, [searchParams, navigate, setAuth]);

  return (
    <div className={`min-h-screen flex items-center justify-center ${
      theme === 'dark' ? 'bg-gray-950' : 'bg-gray-50'
    }`}>
      <div className={`text-center p-8 rounded-xl ${
        theme === 'dark' ? 'bg-gray-900/50' : 'bg-white shadow-lg'
      }`}>
        {error ? (
          <>
            <div className="text-red-500 text-lg mb-2">{error}</div>
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
              잠시 후 로그인 페이지로 이동합니다...
            </p>
          </>
        ) : (
          <>
            <Loader2 className={`w-12 h-12 mx-auto mb-4 animate-spin ${
              theme === 'dark' ? 'text-primary-400' : 'text-primary-600'
            }`} />
            <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
              로그인 처리 중...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
